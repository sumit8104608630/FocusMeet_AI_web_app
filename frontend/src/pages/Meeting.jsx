import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { usePeer } from '../context/PeerContext';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Copy, Check, Users, Monitor, MonitorOff, X } from 'lucide-react';

const Meeting = () => {
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const { socket } = useSocket();
    const { remoteStream, createOffer, createAnswer, setAnswer, resetPeer, replaceTrack } = usePeer();

    const [localStream, setLocalStream] = useState(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [copied, setCopied] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [streamReady, setStreamReady] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isLeaving, setIsLeaving] = useState(false);
    const isLeavingRef = useRef(false);
    const screenStreamRef = useRef(null);

    const localVideoRef = useCallback((node) => {
        if (node && localStream) {
            node.srcObject = localStream;
        }
    }, [localStream]);

    const remoteVideoRef = useCallback((node) => {
        if (node && remoteStream) {
            node.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const initializingStream = useRef(false);
    const hasJoined = useRef(false);
    const localStreamRef = useRef(null);

    // Responsive listener
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        if (!loading && !user) {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            navigate('/');
        }
    }, [user, loading, navigate]);

    const cleanupAndExit = useCallback(() => {
        if (isLeavingRef.current) return;
        isLeavingRef.current = true;
        setIsLeaving(true);

        console.log('Performing final cleanup and exit...');

        // 1. Stop all socket listeners
        if (socket) {
            socket.off('user-joined');
            socket.off('offer');
            socket.off('answer');
            socket.off('room-users');
            socket.off('user-left');
            socket.off('meeting-ended');
            socket.off('call-ended');
            socket.off('error');
        }

        // 2. Stop all media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped track:', track.kind);
            });
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // 3. Reset Peer
        resetPeer();

        // 4. Navigate
        navigate('/dashboard', { replace: true });
    }, [socket, resetPeer, navigate]);

    const startLocalStream = useCallback(async () => {
        if (isLeavingRef.current) return null;
        if (localStreamRef.current || initializingStream.current) return localStreamRef.current;
        
        initializingStream.current = true;
        try {
            console.log('Requesting local stream...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            if (isLeavingRef.current) {
                stream.getTracks().forEach(track => track.stop());
                return null;
            }

            localStreamRef.current = stream;
            setLocalStream(stream);
            setStreamReady(true);
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            if (!isLeavingRef.current) setStreamReady(true); 
            return null;
        } finally {
            initializingStream.current = false;
        }
    }, []);

    const handleUserJoined = useCallback(async ({ socketId: remoteSocketId }) => {
        if (isLeavingRef.current) return;
        
        if (localStreamRef.current && user) {
            const offer = await createOffer(localStreamRef.current, remoteSocketId, true);
            socket.emit('offer', { offer, to: remoteSocketId, from: user.id });
        }
    }, [createOffer, socket, user]);

    const handleOffer = useCallback(async ({ offer, fromSocket: remoteSocketId }) => {
        if (isLeavingRef.current) return;
        const stream = localStreamRef.current || await startLocalStream();
        if (stream && user && !isLeavingRef.current) {
            const answer = await createAnswer(offer, stream, remoteSocketId, true);
            socket.emit('answer', { answer, to: remoteSocketId, from: user.id });
        }
    }, [startLocalStream, createAnswer, socket, user]);

    const handleAnswer = useCallback(async ({ answer }) => {
        if (isLeavingRef.current) return;
        await setAnswer(answer);
    }, [setAnswer]);

    const handleRoomUsers = useCallback(({ users }) => {
        if (!user || !socket || isLeavingRef.current) return;
        const others = users.filter(p => p.socketId !== socket.id);
        setParticipants(others);
    }, [user, socket]);

    // Step 1: Initialize local stream
    useEffect(() => {
        if (isLeavingRef.current) return;
        if (user && !localStreamRef.current) {
            startLocalStream();
        }
    }, [user, startLocalStream]);

    // Step 2 & 3: Join meeting and set up listeners
    useEffect(() => {
        if (isLeavingRef.current) return;
        if (!socket || !user || !streamReady || hasJoined.current) return;

        hasJoined.current = true;
        console.log('Joining meeting:', meetingId);
        socket.emit('join-meeting', { 
            meetingId, 
            userId: user.id,
            name: user.name 
        });

        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('room-users', handleRoomUsers);
        socket.on('user-left', ({ socketId: leftSocketId }) => {
            if (!isLeavingRef.current) resetPeer();
        });
        socket.on('error', ({ message }) => {
            console.error('Socket error:', message);
            cleanupAndExit();
        });
        socket.on('meeting-ended', () => {
            console.log('Meeting ended by host');
            cleanupAndExit();
        });
        socket.on('call-ended', () => {
            cleanupAndExit();
        });

        return () => {
            socket.off('user-joined', handleUserJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('room-users', handleRoomUsers);
            socket.off('user-left');
            socket.off('meeting-ended');
            socket.off('call-ended');
            socket.off('error');
        };
    }, [socket, user, meetingId, streamReady, handleUserJoined, handleOffer, handleAnswer, handleRoomUsers, cleanupAndExit]);

    // Cleanup local stream tracks on unmount
    useEffect(() => {
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [localStream]);

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoOn;
            });
            setIsVideoOn(!isVideoOn);
        }
    };

    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMicOn;
            });
            setIsMicOn(!isMicOn);
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = stream;
                
                const screenTrack = stream.getVideoTracks()[0];
                const videoTrack = localStream.getVideoTracks()[0];
                
                // Replace track in peer connection
                await replaceTrack(videoTrack, screenTrack, localStream);
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                
                screenTrack.onended = () => {
                    stopScreenShare();
                };
                
                setIsScreenSharing(true);
            } catch (err) {
                console.error("Error sharing screen:", err);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = async () => {
        if (screenStreamRef.current) {
            const screenTrack = screenStreamRef.current.getVideoTracks()[0];
            const videoTrack = localStream.getVideoTracks()[0];
            
            // Revert back to local video track
            await replaceTrack(screenTrack, videoTrack, localStream);
            
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
        setIsScreenSharing(false);
    };

    const endCall = useCallback(() => {
        console.log('End Call button clicked');
        if (socket) {
            socket.emit('call-ended', { 
                meetingId: meetingId,
            });
        }
        cleanupAndExit();
    }, [socket, meetingId, cleanupAndExit]);

    const copyCode = () => {
        navigator.clipboard.writeText(meetingId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLeaving) return null;

    if (loading || !user) {
        return (
            <div style={{ 
                height: '100vh', width: '100vw', background: '#06070d', display: 'flex', 
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 20, color: '#fff', fontFamily: "'Figtree', sans-serif",
                position: 'fixed', top: 0, left: 0, zIndex: 9999
            }}>
                <div className="loading-spinner" style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(79,110,247,0.3)'
                }}>
                    <Video size={20} color="#fff" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>
                    {loading ? 'Initializing session...' : 'Redirecting to login...'}
                </p>
                <style>
                    {`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                        .loading-spinner {
                            animation: pulse 2s infinite ease-in-out;
                        }
                        @keyframes pulse {
                            0% { transform: scale(0.95); opacity: 0.8; }
                            50% { transform: scale(1.05); opacity: 1; }
                            100% { transform: scale(0.95); opacity: 0.8; }
                        }
                    `}
                </style>
            </div>
        );
    }

    const renderParticipantCard = (p, isLocal = false, isSmall = false) => {
        const initials = p?.name ? p.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
        const isRemoteVideoActive = !isLocal && remoteStream;

        return (
            <div key={isLocal ? 'local' : p.socketId} style={{
                width: '100%',
                height: '100%',
                background: '#0d1021',
                borderRadius: isSmall ? 12 : (isMobile ? 16 : 24),
                overflow: 'hidden',
                position: 'relative',
                border: isLocal ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(79,110,247,0.3)',
                boxShadow: isSmall ? 'none' : (isLocal ? '0 20px 50px rgba(0,0,0,0.3)' : '0 20px 50px rgba(79,110,247,0.1)')
            }}>
                {/* Participant Video */}
                <video 
                    ref={isLocal ? localVideoRef : remoteVideoRef} 
                    autoPlay 
                    muted={isLocal}
                    playsInline 
                    style={{ 
                        width: '100%', height: '100%', objectFit: 'cover', 
                        transform: isLocal ? 'scaleX(-1)' : 'none',
                        display: (isLocal && isVideoOn) || (!isLocal && remoteStream) ? 'block' : 'none'
                    }}
                />
                
                {/* Fallback Initials when video off */}
                {((isLocal && !isVideoOn) || (!isLocal && !isRemoteVideoActive)) && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', background: '#0d1021'
                    }}>
                        <div style={{
                            width: isSmall ? 40 : (isMobile ? 60 : 80), 
                            height: isSmall ? 40 : (isMobile ? 60 : 80), 
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: isSmall ? 14 : (isMobile ? 18 : 24), 
                            fontWeight: 800, color: '#fff'
                        }}>
                            {initials}
                        </div>
                    </div>
                )}

                <div style={{
                    position: 'absolute', 
                    bottom: isSmall ? 8 : (isMobile ? 12 : 16), 
                    left: isSmall ? 8 : (isMobile ? 12 : 16),
                    background: 'rgba(0,0,0,0.5)', padding: isSmall ? '2px 8px' : '4px 12px',
                    borderRadius: 6, fontSize: isSmall ? 10 : (isMobile ? 10 : 12), 
                    fontWeight: 600, color: '#fff',
                    fontFamily: "'Nunito', sans-serif"
                }}>
                    {isLocal ? 'You' : p.name}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            height: '100vh',
            background: '#06070d',
            display: 'flex',
            flexDirection: 'column',
            color: '#e8eaf2',
            fontFamily: "'Figtree', sans-serif",
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: isMobile ? '8px 16px' : '16px 32px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                minHeight: isMobile ? 60 : 70
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                    <div style={{
                        width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Video size={isMobile ? 14 : 16} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: isMobile ? 14 : 18, fontWeight: 700, margin: 0 }}>AttendAI</h1>
                </div>

                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: isMobile ? 8 : 24,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 10 }}>
                        <span style={{ fontSize: isMobile ? 10 : 12, color: '#6b7280', fontWeight: 600, fontFamily: "'Nunito', sans-serif", display: isMobile ? 'none' : 'inline' }}>CODE:</span>
                        <div 
                            onClick={copyCode}
                            style={{ 
                                padding: isMobile ? '4px 8px' : '6px 12px', background: 'rgba(79,110,247,0.1)', 
                                border: '1px solid rgba(79,110,247,0.3)', borderRadius: 8,
                                color: '#4f6ef7', fontWeight: 800, fontSize: isMobile ? 11 : 13, letterSpacing: 0.5,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'all 0.2s', fontFamily: "'Nunito', sans-serif"
                            }}
                        >
                            {meetingId}
                            {copied ? <Check size={12} color="#22d3a0" /> : <Copy size={10} />}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: isMobile ? 11 : 12, fontFamily: "'Nunito', sans-serif" }}>
                        <Users size={isMobile ? 10 : 12} />
                        {participants.length + 1}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                padding: isMobile ? '8px' : '20px',
                gap: '20px',
                overflow: 'hidden'
            }}>
                {/* Focused Video Area */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {participants.length > 0 
                        ? renderParticipantCard(participants[0], false)
                        : renderParticipantCard(user, true)
                    }
                </div>

                {/* Sidebar Participants (if any) */}
                {(participants.length > 0 || !isMobile) && (
                    <div style={{
                        width: isMobile ? '100%' : '280px',
                        height: isMobile ? '120px' : '100%',
                        display: 'flex',
                        flexDirection: isMobile ? 'row' : 'column',
                        gap: '12px',
                        overflowX: isMobile ? 'auto' : 'hidden',
                        overflowY: isMobile ? 'hidden' : 'auto',
                        padding: isMobile ? '4px 0' : '0 4px',
                        flexShrink: 0
                    }}>
                        {/* Always show self in sidebar when someone else is in main focus */}
                        {participants.length > 0 && (
                            <div style={{ width: isMobile ? '160px' : '100%', height: isMobile ? '100%' : '150px', flexShrink: 0 }}>
                                {renderParticipantCard(user, true, true)}
                            </div>
                        )}
                        
                        {/* Other participants in sidebar */}
                        {participants.slice(1).map(p => (
                            <div key={p.socketId} style={{ width: isMobile ? '160px' : '100%', height: isMobile ? '100%' : '150px', flexShrink: 0 }}>
                                {renderParticipantCard(p, false, true)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div style={{
                padding: isMobile ? '12px' : '16px',
                background: 'rgba(13, 16, 33, 0.8)',
                backdropFilter: 'blur(10px)',
                margin: isMobile ? '0 12px 12px' : '0 20px 20px',
                borderRadius: isMobile ? 16 : 24,
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: isMobile ? '8px' : '12px',
                zIndex: 10
            }}>
                <button 
                    onClick={toggleMic}
                    title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                    style={{
                        width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 12, border: 'none',
                        background: isMicOn ? 'rgba(255,255,255,0.05)' : '#ef4444',
                        color: '#fff', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    }}
                >
                    {isMicOn ? <Mic size={isMobile ? 18 : 20} /> : <MicOff size={isMobile ? 18 : 20} />}
                </button>
                <button 
                    onClick={toggleVideo}
                    title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
                    style={{
                        width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 12, border: 'none',
                        background: isVideoOn ? 'rgba(255,255,255,0.05)' : '#ef4444',
                        color: '#fff', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    }}
                >
                    {isVideoOn ? <Video size={isMobile ? 18 : 20} /> : <VideoOff size={isMobile ? 18 : 20} />}
                </button>
                <button 
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                    style={{
                        width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 12, border: 'none',
                        background: isScreenSharing ? '#4f6ef7' : 'rgba(255,255,255,0.05)',
                        color: '#fff', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    }}
                >
                    {isScreenSharing ? <MonitorOff size={isMobile ? 18 : 20} /> : <Monitor size={isMobile ? 18 : 20} />}
                </button>
                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                <button 
                    onClick={endCall}
                    title="End Call"
                    style={{
                        width: isMobile ? 56 : 64, height: isMobile ? 40 : 48, borderRadius: 12, border: 'none',
                        background: '#ef4444', color: '#fff', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(239,68,68,0.2)',
                    }}
                >
                    <PhoneOff size={isMobile ? 18 : 20} />
                </button>
            </div>
        </div>
    );
};

export default Meeting;
