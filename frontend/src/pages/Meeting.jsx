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
    const { 
        remoteStreams, 
        createOffer, 
        createAnswer, 
        setAnswer, 
        resetPeers, 
        removePeer, 
        setLocalStream 
    } = usePeer();

    const [localStream, setLocalStreamState] = useState(null);
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
    const localMainVideoRef = useRef(null);
    const localSidebarVideoRef = useRef(null);
    const remoteVideoRefs = useRef({});

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

    // CREATE A PROPER LOCAL PARTICIPANT OBJECT!
    const localParticipant = {
        name: user?.name || 'You',
        socketId: socket?.id,
        userId: user?.id
    };

    // COMBINE LOCAL + REMOTE PARTICIPANTS (NO DUPLICATES EVER!)
    const uniqueParticipants = [];
    const seenUserIds = new Set();
    if (user?.id) seenUserIds.add(user.id);
    
    participants.forEach(p => {
        // Only add if we haven't seen this userId and it's not us
        if (p.userId && !seenUserIds.has(p.userId) && p.socketId !== socket?.id) {
            uniqueParticipants.push(p);
            seenUserIds.add(p.userId);
        }
    });

    const allParticipants = [localParticipant, ...uniqueParticipants];

    // LOG OUR SOCKET ID AND USER ID RIGHT AWAY!
    useEffect(() => {
        if (socket) {
            console.log('🔵 MY SOCKET ID:', socket.id);
        }
        if (user) {
            console.log('🔵 MY USER ID:', user.id);
            console.log('🔵 MY NAME:', user.name);
        }
        console.log('👥 ALL PARTICIPANTS:', allParticipants);
    }, [socket, user, allParticipants]);

    useEffect(() => {
        // Reset flags when component mounts
        hasJoined.current = false;
        isLeavingRef.current = false;
        localStreamRef.current = null;
        
        // ALSO RESET ALL PEER CONNECTIONS AND REMOTE STREAMS ON MOUNT!
        resetPeers();
        
        if (!loading && !user) {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            navigate('/');
        }
    }, [user, loading, navigate, resetPeers]);

    // Step 4: Ensure remote videos are playing when streams update
    useEffect(() => {
        Object.entries(remoteStreams).forEach(([socketId, stream]) => {
            const videoEl = remoteVideoRefs.current[socketId];
            if (videoEl && stream) {
                if (videoEl.srcObject !== stream) {
                    console.log(`📺 Assigning stream to video for socket: ${socketId}`);
                    videoEl.srcObject = stream;
                }
                videoEl.play().catch(err => console.warn(`⚠️ Error playing video for ${socketId}:`, err));
            }
        });
    }, [remoteStreams]);

    const cleanupAndExit = useCallback(() => {
        if (isLeavingRef.current) return;
        isLeavingRef.current = true;
        setIsLeaving(true);

        console.log('🧹 Performing final cleanup and exit...');

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

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Stopped track:', track.kind);
            });
            localStreamRef.current = null; 
            setLocalStreamState(null);
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        setStreamReady(false);
        hasJoined.current = false;
        initializingStream.current = false;

        resetPeers();

        navigate('/dashboard', { replace: true });
    }, [socket, resetPeers, navigate]);

    const startLocalStream = useCallback(async () => {
        if (isLeavingRef.current) return null;
        if (localStreamRef.current || initializingStream.current) return localStreamRef.current;
        
        initializingStream.current = true;
        console.log('🚀 Starting local stream initialization...');
        
        try {
            console.log('📷 Attempting to get camera + microphone...');
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                console.log('✅ Video + Audio stream obtained!');
            } catch (videoError) {
                console.warn('⚠️ Camera unavailable, trying audio-only...');
                stream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                });
                console.log('✅ Audio-only stream obtained!');
            }
            
            if (isLeavingRef.current) {
                console.log('⚠️ Already leaving, stopping new stream');
                stream.getTracks().forEach(track => track.stop());
                return null;
            }

            localStreamRef.current = stream;
            setLocalStreamState(stream);
            setLocalStream(stream);
            setStreamReady(true);
            return stream;
        } catch (err) {
            console.error('❌ Error accessing media devices:', err);
            if (!isLeavingRef.current) setStreamReady(true); 
            return null;
        } finally {
            initializingStream.current = false;
            console.log('🎯 Stream initialization complete');
        }
    }, [setLocalStream]);

    // Directly assign local stream to both video elements
    useEffect(() => {
        if (localMainVideoRef.current) {
            if (localStream) {
                localMainVideoRef.current.srcObject = localStream;
                localMainVideoRef.current.load();
                localMainVideoRef.current.play().catch(err => console.warn('⚠️ Autoplay blocked:', err));
            } else {
                localMainVideoRef.current.srcObject = null;
            }
        }
        if (localSidebarVideoRef.current) {
            if (localStream) {
                localSidebarVideoRef.current.srcObject = localStream;
                localSidebarVideoRef.current.load();
                localSidebarVideoRef.current.play().catch(err => console.warn('⚠️ Sidebar autoplay blocked:', err));
            } else {
                localSidebarVideoRef.current.srcObject = null;
            }
        }
    }, [localStream]);

    const handleUserJoined = useCallback(async ({ socketId: remoteSocketId, userId, name }) => {
        if (isLeavingRef.current) return;
        
        // FIRST CHECK: Is this OUR OWN socket ID? If yes, ignore!
        if (socket && remoteSocketId === socket.id) {
            console.warn('⚠️ Ignoring user-joined event for our OWN socket ID');
            return;
        }
        
        console.log('👋 New user joined:', remoteSocketId, name);
        
        if (localStreamRef.current && user) {
            const offer = await createOffer(localStreamRef.current, remoteSocketId);
            if (offer) {
                socket.emit('offer', { offer, to: remoteSocketId, from: user.id });
            }
        }
    }, [createOffer, socket, user]);

    const handleOffer = useCallback(async ({ offer, fromSocket: remoteSocketId, from }) => {
        if (isLeavingRef.current) return;
        
        // FIRST CHECK: Is this OUR OWN socket ID? If yes, ignore!
        if (socket && remoteSocketId === socket.id) {
            console.warn('⚠️ Ignoring offer from our OWN socket ID');
            return;
        }
        
        console.log('📥 Received offer from:', remoteSocketId);
        const stream = localStreamRef.current || await startLocalStream();
        
        if (stream && user && !isLeavingRef.current) {
            const answer = await createAnswer(offer, stream, remoteSocketId);
            if (answer) {
                socket.emit('answer', { answer, to: remoteSocketId, from: user.id });
            }
        }
    }, [startLocalStream, createAnswer, socket, user]);

    const handleAnswer = useCallback(async ({ answer, fromSocket: remoteSocketId }) => {
        if (isLeavingRef.current) return;
        
        // FIRST CHECK: Is this OUR OWN socket ID? If yes, ignore!
        if (socket && remoteSocketId === socket.id) {
            console.warn('⚠️ Ignoring answer from our OWN socket ID');
            return;
        }
        
        await setAnswer(answer, remoteSocketId);
    }, [setAnswer, socket]);

    const handleRoomUsers = useCallback(({ users }) => {
        if (!user || !socket || isLeavingRef.current) return;
        
        console.log('📡 RAW room-users event received:', users);
        
        // Filter out ourselves AND remove duplicates by socketId AND userId!
        const uniqueOthers = users.filter((p, index, array) => 
            p.socketId !== socket.id &&  // NOT our own socket ID
            p.userId !== user.id &&     // ALSO NOT our own userId!
            array.findIndex(item => item.socketId === p.socketId) === index
        );
        
        console.log('✅ FILTERED room users:', uniqueOthers.map(p => ({name: p.name, socketId: p.socketId, userId: p.userId})));
        setParticipants(uniqueOthers);
    }, [user, socket]);

    const handleUserLeft = useCallback(({ socketId: leftSocketId }) => {
        if (!isLeavingRef.current) {
            // FIRST CHECK: Is this OUR OWN socket ID? If yes, ignore!
            if (socket && leftSocketId === socket.id) {
                console.warn('⚠️ Ignoring user-left event for our OWN socket ID');
                return;
            }
            
            console.log('👋 User left:', leftSocketId);
            removePeer(leftSocketId);
            setParticipants(prev => prev.filter(p => p.socketId !== leftSocketId));
        }
    }, [removePeer, socket]);

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
        console.log('🚪 Joining meeting:', meetingId);
        socket.emit('join-meeting', { 
            meetingId, 
            userId: user.id,
            name: user.name 
        });

        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('room-users', handleRoomUsers);
        socket.on('user-left', handleUserLeft);
        socket.on('error', ({ message }) => {
            console.error('❌ Socket error:', message);
            if (!isLeavingRef.current) cleanupAndExit();
        });
        socket.on('meeting-ended', () => {
            console.log('📢 Meeting ended by host');
            if (!isLeavingRef.current) cleanupAndExit();
        });
        socket.on('call-ended', () => {
            console.log('📢 Call ended by other user');
            if (!isLeavingRef.current) cleanupAndExit();
        });

        return () => {
            socket.off('user-joined', handleUserJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('room-users', handleRoomUsers);
            socket.off('user-left', handleUserLeft);
            socket.off('error');
            socket.off('meeting-ended');
            socket.off('call-ended');
        };
    }, [socket, user, streamReady, meetingId, handleUserJoined, handleOffer, handleAnswer, handleRoomUsers, handleUserLeft, cleanupAndExit]);

    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !isMicOn;
                setIsMicOn(!isMicOn);
            }
        }
    }, [isMicOn]);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !isVideoOn;
                setIsVideoOn(!isVideoOn);
            }
        }
    }, [isVideoOn]);

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = stream;
                setIsScreenSharing(true);
                
                const videoTrack = stream.getVideoTracks()[0];
                videoTrack.onended = stopScreenShare;

                // Replace video track in all peers
                // (Simplified - you could implement full track replacement if needed)
                console.log('📺 Screen sharing started');
            } catch (err) {
                console.error("❌ Error sharing screen:", err);
            }
        }
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
            setIsScreenSharing(false);
        }
    };

    const endCall = useCallback(() => {
        console.log('📞 End Call button clicked');
        if (isLeavingRef.current) return;
        
        if (socket) {
            socket.emit('call-ended', { 
                meetingId,
            });
        }
        cleanupAndExit();
    }, [socket, meetingId, cleanupAndExit]);

    const copyCode = () => {
        navigator.clipboard.writeText(meetingId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderParticipantCard = (p, isLocal = false, isSmall = false, isSidebar = false) => {
        console.log('🎨 Rendering participant card:', {
            isLocal,
            participantName: p?.name,
            participantSocketId: p?.socketId,
            participantUserId: p?.userId,
            mySocketId: socket?.id,
            myUserId: user?.id
        });
        
        const initials = p?.name ? p.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
        const remoteStream = remoteStreams[p.socketId];
        
        // FINAL CHECK: Never show our own stream as remote!
        if (!isLocal && localStreamRef.current && remoteStream === localStreamRef.current) {
            console.warn('⚠️ BLOCKED: Trying to render our own local stream as remote!');
            return null;
        }

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
                {/* ALWAYS SHOW LOCAL VIDEO */}
                {isLocal && (
                    <video 
                        ref={isSidebar ? localSidebarVideoRef : localMainVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        style={{ 
                            width: '100%', height: '100%', objectFit: 'cover', 
                            transform: 'scaleX(-1)',
                            display: !isVideoOn ? 'none' : 'block'
                        }}
                    />
                )}

                {/* REMOTE VIDEO */}
                {!isLocal && remoteStream && (
                    <video 
                        ref={(node) => {
                            if (node) {
                                remoteVideoRefs.current[p.socketId] = node;
                                if (remoteVideoRefs.current[p.socketId].srcObject !== remoteStream) {
                                    remoteVideoRefs.current[p.socketId].srcObject = remoteStream;
                                    remoteVideoRefs.current[p.socketId].load();
                                    remoteVideoRefs.current[p.socketId].play().catch(err => console.warn('⚠️ Remote autoplay blocked:', err));
                                }
                            }
                        }}
                        autoPlay 
                        playsInline 
                        style={{ 
                            width: '100%', height: '100%', objectFit: 'cover', 
                        }}
                    />
                )}
                
                {/* Fallback Initials - ONLY WHEN NO VIDEO */}
                {((isLocal && !isVideoOn) || (!isLocal && !remoteStream)) && (
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
                <div>Loading...</div>
            </div>
        );
    }

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
                    <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: 0 }}>
                        AttendAI
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
                    <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(79,110,247,0.1)',
                        padding: '6px 12px', borderRadius: 8,
                        border: '1px solid rgba(79,110,247,0.3)'
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>CODE:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#4f6ef7' }}>{meetingId}</span>
                        <button onClick={copyCode} style={{
                            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: copied ? '#22c55e' : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center'
                        }}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={isMobile ? 16 : 18} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: isMobile ? 12 : 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                            {allParticipants.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: isMobile ? '8px' : '20px',
                gap: '20px',
                overflow: 'hidden'
            }}>
                {/* Focused Video Area - Grid for all participants */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    height: '100%',
                    display: 'grid',
                    // Responsive grid columns
                    gridTemplateColumns: allParticipants.length === 1 ? '1fr' : 
                                       allParticipants.length === 2 ? (isMobile ? '1fr' : '1fr 1fr') :
                                       allParticipants.length <= 4 ? 'repeat(2, 1fr)' :
                                       'repeat(auto-fit, minmax(300px, 1fr))',
                    // Responsive grid rows
                    gridTemplateRows: allParticipants.length <= 2 ? '1fr' : 
                                    allParticipants.length <= 4 ? 'repeat(2, 1fr)' :
                                    'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16
                }}>
                    {allParticipants.map((p, index) => 
                        renderParticipantCard(p, index === 0)  // First participant is always LOCAL!
                    )}
                </div>
            </div>

            {/* Controls Bar */}
            <div style={{
                padding: isMobile ? '12px' : '16px',
                background: 'rgba(13,16,33,0.8)',
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
                        width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 12, border: 'none',
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
                        width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 12, border: 'none',
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
                        width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 12, border: 'none',
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
                        width: isMobile ? 56 : 64, height: isMobile ? 44 : 52, borderRadius: 12, border: 'none',
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
