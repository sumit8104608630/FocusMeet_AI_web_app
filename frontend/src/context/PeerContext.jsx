import React, { 
  createContext, 
  useCallback, 
  useContext, 
  useEffect, 
  useRef, 
  useState, 
} from "react"; 
import { useSocket } from "./SocketContext"; 


const PeerContext = createContext(null); 


  // ─── Constants ───────────────────────────────────────────────────────────── 
const ICE_SERVERS = { 
  iceServers: [ 
    // --- TURN Servers (Primary) --- 
    { 
      urls: "turn:global.relay.metered.ca:80", 
      username: "9abe2392a35d2cc1474c2eee", 
      credential: "5ZR0R5WRC7DmLLmn", 
    }, 
    { 
      urls: "turn:global.relay.metered.ca:80?transport=tcp", 
      username: "9abe2392a35d2cc1474c2eee", 
      credential: "5ZR0R5WRC7DmLLmn", 
    }, 
    { 
      urls: "turn:global.relay.metered.ca:443", 
      username: "9abe2392a35d2cc1474c2eee", 
      credential: "5ZR0R5WRC7DmLLmn", 
    }, 
    { 
      urls: "turns:global.relay.metered.ca:443?transport=tcp", 
      username: "9abe2392a35d2cc1474c2eee", 
      credential: "5ZR0R5WRC7DmLLmn", 
    }, 
    // --- STUN Servers (Fallback) --- 
    { urls: "stun:stun.l.google.com:19302" }, 
    { urls: "stun:stun1.l.google.com:19302" }, 
    { urls: "stun:stun2.l.google.com:19302" }, 
    { urls: "stun:stun.services.mozilla.com" }, 
    { urls: "stun:stun.relay.metered.ca:80" }, 
  ], 
}; 


// ─── Peer Provider Component ──────────────────────────────────────────────── 
export const PeerProvider = ({ children }) => { 
  // ── Refs ────────────────────────────────────────────────────────────────── 
  const peersRef       = useRef({}); // Map<socketId, RTCPeerConnection>
  const iceCandidatesRef = useRef({}); // Map<socketId, candidate[]>
  const remoteStreamsRef = useRef({}); // Map<socketId, MediaStream>
  const localStreamRef = useRef(null);


  // ── State ───────────────────────────────────────────────────────────────── 
  const [remoteStreams, setRemoteStreams] = useState({}); // Map<socketId, MediaStream>
  const { socket } = useSocket(); 


  // ── Helper: Get or Create Peer Connection ─────────────────────────────────
  const getOrCreatePeer = useCallback((socketId, localStream) => {
    // FIRST CHECK: Is this OUR OWN SOCKET ID? If yes, RETURN NULL and do NOTHING!
    if (socket && socketId === socket.id) {
      console.warn('⚠️ Ignoring peer creation request for our OWN socket ID:', socketId);
      return null;
    }
    
    if (peersRef.current[socketId]) {
      return peersRef.current[socketId];
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[socketId] = peer;
    iceCandidatesRef.current[socketId] = [];

    // Add local tracks to this peer
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log('➕ Adding local track to peer:', track.kind, 'for socket:', socketId);
        peer.addTrack(track, localStream);
      });
    }

    // Forward local ICE candidates
    peer.onicecandidate = ({ candidate }) => { 
      if (candidate && socket) {
        console.log('📤 Generated local ICE candidate for socket:', socketId);
        socket.emit("ice-candidate", { 
          candidate, 
          to: socketId, 
        }); 
      } 
    }; 

    // Handle incoming media tracks
    peer.ontrack = (event) => { 
      console.log('✅ ontrack event received from socket:', socketId, 'track kind:', event.track.kind);
      
      // DOUBLE CHECK: Is this OUR OWN TRACK? If yes, IGNORE!
      const isLocalTrack = localStreamRef.current && 
                           localStreamRef.current.getTracks().some(t => t.id === event.track.id);
      
      if (isLocalTrack) {
        console.warn('⚠️ Ignoring ontrack event from OUR OWN local track!');
        return;
      }
      
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log('✅ Setting remote stream for socket:', socketId);
        remoteStreamsRef.current[socketId] = stream;
        setRemoteStreams(prev => ({ ...prev, [socketId]: stream }));
      } else {
        if (!remoteStreamsRef.current[socketId]) {
          remoteStreamsRef.current[socketId] = new MediaStream();
        }
        const existingTracks = remoteStreamsRef.current[socketId].getTracks();
        if (!existingTracks.find(t => t.id === event.track.id)) {
          console.log('➕ Adding remote track to stream for socket:', socketId);
          remoteStreamsRef.current[socketId].addTrack(event.track);
          const newStream = new MediaStream(remoteStreamsRef.current[socketId].getTracks());
          setRemoteStreams(prev => ({ ...prev, [socketId]: newStream }));
        }
      }
    }; 

    // Handle connection state changes
    peer.onconnectionstatechange = () => { 
      console.log(`🔄 Peer ${socketId} state:`, peer.connectionState);
      if (peer.connectionState === "failed" || peer.connectionState === "closed") { 
        console.log(`❌ Peer ${socketId} closed/failed`);
        removePeer(socketId);
      } else if (peer.connectionState === 'connected') {
        console.log(`✅ Peer ${socketId} successfully connected!`);
      }
    }; 

    return peer;
  }, [socket]);

  // ── Helper: Remove Peer Connection ──────────────────────────────────────────
  const removePeer = useCallback((socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
    if (remoteStreamsRef.current[socketId]) {
      remoteStreamsRef.current[socketId].getTracks().forEach(t => t.stop());
      delete remoteStreamsRef.current[socketId];
    }
    if (iceCandidatesRef.current[socketId]) {
      delete iceCandidatesRef.current[socketId];
    }
    setRemoteStreams(prev => {
      const newStreams = { ...prev };
      delete newStreams[socketId];
      return newStreams;
    });
  }, []);

  // ── Helper: Flush ICE Candidates for Specific Peer ──────────────────────────
  const flushIceCandidates = useCallback(async (socketId) => { 
    const peer = peersRef.current[socketId];
    if (!peer || !peer.remoteDescription) {
      console.warn('⚠️ Cannot flush ICE: No peer or remote description');
      return;
    }

    const candidates = iceCandidatesRef.current[socketId] || [];
    console.log(`🔄 Flushing ${candidates.length} ICE candidates for socket:`, socketId);
    
    while (candidates.length > 0) { 
      const candidate = candidates.shift(); 
      try { 
        await peer.addIceCandidate(candidate); 
        console.log(`✅ Added ICE candidate for socket:`, socketId);
      } catch (err) { 
        console.error(`❌ Error adding ICE for socket ${socketId}:`, err);
      } 
    } 
  }, []); 

  // ── Helper: Set Local Stream for All Peers ───────────────────────────────────
  const setLocalStream = useCallback((stream) => {
    localStreamRef.current = stream;
    
    // Add the new stream to all existing peers
    Object.entries(peersRef.current).forEach(([socketId, peer]) => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          console.log('➕ Adding local track to existing peer:', track.kind, 'for socket:', socketId);
          peer.addTrack(track, stream);
        });
      }
    });
  }, []);


  // ── Signaling Actions ───────────────────────────────────────────────────── 
  const createOffer = useCallback( 
    async (stream, targetSocketId) => { 
      // FIRST CHECK: Is this OUR OWN socket ID? If yes, RETURN NULL!
      if (socket && targetSocketId === socket.id) {
        console.warn('⚠️ Ignoring createOffer for our OWN socket ID:', targetSocketId);
        return null;
      }
      
      console.log('📡 Creating WebRTC Offer for socket:', targetSocketId);
      localStreamRef.current = stream;
      
      const peer = getOrCreatePeer(targetSocketId, stream); 
      if (!peer) {
        console.warn('⚠️ No peer created for socket:', targetSocketId);
        return null;
      }
      
      iceCandidatesRef.current[targetSocketId] = [];

      const offer = await peer.createOffer({ 
        offerToReceiveAudio: true, 
        offerToReceiveVideo: true, 
      }); 
      
      await peer.setLocalDescription(offer); 
      console.log('✅ Offer created for socket:', targetSocketId);
      return offer; 
    }, 
    [getOrCreatePeer, socket] 
  ); 


  const createAnswer = useCallback( 
    async (offer, stream, targetSocketId) => { 
      // FIRST CHECK: Is this OUR OWN socket ID? If yes, RETURN NULL!
      if (socket && targetSocketId === socket.id) {
        console.warn('⚠️ Ignoring createAnswer for our OWN socket ID:', targetSocketId);
        return null;
      }
      
      console.log('📡 Creating WebRTC Answer for socket:', targetSocketId);
      localStreamRef.current = stream;
      
      const peer = getOrCreatePeer(targetSocketId, stream); 
      if (!peer) {
        console.warn('⚠️ No peer created for socket:', targetSocketId);
        return null;
      }

      try { 
        await peer.setRemoteDescription(new RTCSessionDescription(offer)); 
        await flushIceCandidates(targetSocketId); 

        const answer = await peer.createAnswer({ 
          offerToReceiveAudio: true, 
          offerToReceiveVideo: true, 
        }); 
        
        await peer.setLocalDescription(answer); 
        console.log('✅ Answer created for socket:', targetSocketId);
        return answer; 
      } catch (err) { 
        console.error('❌ Error creating answer:', err);
        throw err; 
      } 
    }, 
    [getOrCreatePeer, flushIceCandidates, socket] 
  ); 

  const setAnswer = useCallback(async (answer, targetSocketId) => { 
    // FIRST CHECK: Is this OUR OWN socket ID? If yes, IGNORE!
    if (socket && targetSocketId === socket.id) {
      console.warn('⚠️ Ignoring setAnswer for our OWN socket ID:', targetSocketId);
      return;
    }
    
    console.log('📥 Received WebRTC answer for socket:', targetSocketId);
    const peer = peersRef.current[targetSocketId];
    if (!peer) {
      console.warn('⚠️ No peer found for socket:', targetSocketId);
      return;
    }
    
    try { 
      console.log('🤝 Setting remote description for socket:', targetSocketId);
      await peer.setRemoteDescription(new RTCSessionDescription(answer)); 
      await flushIceCandidates(targetSocketId); 
    } catch (err) { 
      console.error('❌ Error setting answer:', err); 
    } 
  }, [flushIceCandidates, socket]); 

  const resetPeers = useCallback(() => { 
    console.log('🔄 Resetting all peer connections');
    Object.keys(peersRef.current).forEach(socketId => {
      removePeer(socketId);
    });
    peersRef.current = {};
    iceCandidatesRef.current = {};
    remoteStreamsRef.current = {};
    setRemoteStreams({});
  }, [removePeer]); 


  // ── Socket Events ───────────────────────────────────────────────────────── 
  useEffect(() => { 
    if (!socket) return; 
    console.log('🔌 PeerContext: Setting up socket listeners for multiple users');

    const handleIceCandidate = async ({ candidate, fromSocket }) => { 
      if (!candidate || !fromSocket) return; 
      console.log('📨 Received ICE candidate from socket:', fromSocket);

      const peer = peersRef.current[fromSocket]; 
      if (!peer) {
        console.warn('⚠️ No peer found, queuing ICE for later');
        if (!iceCandidatesRef.current[fromSocket]) {
          iceCandidatesRef.current[fromSocket] = [];
        }
        iceCandidatesRef.current[fromSocket].push(candidate);
        return;
      }

      if (!peer.remoteDescription) { 
        console.log('📥 Queueing ICE candidate for later');
        if (!iceCandidatesRef.current[fromSocket]) {
          iceCandidatesRef.current[fromSocket] = [];
        }
        iceCandidatesRef.current[fromSocket].push(candidate);
        return; 
      } 

      try { 
        console.log('🤝 Adding ICE candidate from socket:', fromSocket);
        await peer.addIceCandidate(candidate); 
      } catch (err) { 
        console.error('❌ Error adding ICE candidate:', err); 
      } 
    }; 

    socket.on("ice-candidate", handleIceCandidate); 
    return () => socket.off("ice-candidate", handleIceCandidate); 
  }, [socket, flushIceCandidates]); 


  // ── Cleanup ──────────────────────────────────────────────────────────────── 
  useEffect(() => { 
    return () => { 
      Object.values(peersRef.current).forEach(peer => peer.close());
    }; 
  }, []); 


  return ( 
    <PeerContext.Provider 
      value={{ 
        remoteStreams, 
        createOffer, 
        createAnswer, 
        setAnswer, 
        resetPeers, 
        removePeer,
        setLocalStream
      }} 
    > 
      {children} 
    </PeerContext.Provider> 
  ); 
}; 

export const usePeer = () => { 
  const context = useContext(PeerContext); 
  if (!context) throw new Error("usePeer must be used within a PeerProvider"); 
  return context; 
};
