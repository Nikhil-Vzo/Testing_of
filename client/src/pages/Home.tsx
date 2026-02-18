import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { MatchProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { Heart, X, MapPin, GraduationCap, Ghost, CheckCircle2, School, Globe, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { analytics } from '../utils/analytics';

import { getRandomQuote } from '../data/loadingQuotes';
import { safeSetItem } from '../utils/storage';

// Cache key for session storage
const PROFILES_CACHE_KEY = 'otherhalf_discover_cache_v2';
const CACHE_EXPIRY_KEY = 'otherhalf_discover_cache_expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Calculate age from DOB string
const getAge = (dob?: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

export const Home: React.FC = () => {
    const { currentUser } = useAuth();
    const [queue, setQueue] = useState<MatchProfile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [quote] = useState(getRandomQuote());
    const [dragX, setDragX] = useState(0);
    const [dragY, setDragY] = useState(0);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);

    const [filterMode, setFilterMode] = useState<'campus' | 'global'>('campus');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const { unreadCount } = useNotifications();
    const preloadedImages = useRef<Set<string>>(new Set());

    const [isDragging, setIsDragging] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const [showSuccessBurst, setShowSuccessBurst] = useState(false);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isRecycleMode, setIsRecycleMode] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const preloadImages = useCallback((profiles: MatchProfile[]) => {

        profiles.forEach(profile => {
            if (profile.avatar && !preloadedImages.current.has(profile.avatar)) {
                const img = new Image();
                img.src = profile.avatar;
                preloadedImages.current.add(profile.avatar);
            }
        });
    }, []);

    const fetchSkippedProfiles = async () => {
        if (!currentUser || !supabase) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_skipped_profiles', {
                current_user_id: currentUser.id,
                match_mode: filterMode,
                user_university: currentUser.university
            });

            if (error) throw error;

            if (data && data.length > 0) {
                const mappedProfiles: MatchProfile[] = data.map((p: any) => ({
                    id: p.id,
                    anonymousId: p.anonymous_id,
                    realName: p.real_name,
                    gender: p.gender,
                    university: p.university,
                    branch: p.branch,
                    year: p.year,
                    interests: p.interests || [],
                    bio: p.bio,
                    dob: p.dob,
                    isVerified: p.is_verified,
                    avatar: p.avatar,
                    lookingFor: p.looking_for || [],
                    matchPercentage: Math.floor(Math.random() * (99 - 70 + 1) + 70),
                    distance: 'Recycled'
                }));
                setQueue(mappedProfiles);
                setIsRecycleMode(true);
                preloadImages(mappedProfiles.slice(0, 5));
            } else {
                alert("No skipped profiles found yet! Swipe left on some people first, or your previous history might have been reset during the update.");
            }
        } catch (err) {
            console.error('Error fetching skipped profiles:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load users from Supabase (with caching)
    const fetchFreshData = useCallback(async (showLoading: boolean) => {
        if (!currentUser || !supabase) return;

        if (showLoading) setIsLoading(true);

        try {
            // Fetch new matches with server-side filtering
            let { data, error } = await supabase.rpc('get_potential_matches', {
                user_id: currentUser.id,
                match_mode: filterMode,
                user_university: currentUser.university
            });

            if (error) {
                console.error('Error fetching matches:', error);
                if (showLoading) setIsLoading(false);
                return;
            }

            if (data) {
                const mappedProfiles: MatchProfile[] = data.map((p: any) => ({
                    id: p.id,
                    anonymousId: p.anonymous_id,
                    realName: p.real_name,
                    gender: p.gender,
                    university: p.university,
                    branch: p.branch,
                    year: p.year,
                    interests: p.interests || [],
                    bio: p.bio,
                    dob: p.dob,
                    isVerified: p.is_verified,
                    avatar: p.avatar,
                    lookingFor: p.looking_for || [],
                    matchPercentage: Math.floor(Math.random() * (99 - 70 + 1) + 70),
                    distance: filterMode === 'campus' ? 'On Campus' : 'Global'
                }));

                // Update state
                setQueue(mappedProfiles);
                setIsRecycleMode(false);
                preloadImages(mappedProfiles.slice(0, 5));

                // Cache the data safely
                try {
                    sessionStorage.setItem(PROFILES_CACHE_KEY, JSON.stringify(mappedProfiles));
                    sessionStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
                } catch (e) {
                    console.warn('Failed to cache profiles:', e);
                    // If quota exceeded, we just don't cache. No crash.
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [currentUser, filterMode, preloadImages]);

    // Load users from Supabase (with caching)
    useEffect(() => {
        const fetchPotentialMatches = async () => {
            if (!currentUser || !supabase) {
                setIsLoading(false);
                return;
            }

            // Check if this is a fresh signup (no cached data yet)
            const cachedData = sessionStorage.getItem(PROFILES_CACHE_KEY);
            const isFreshSignup = !cachedData;

            // 1. Try to load from cache first (instant load) - but only if not a fresh signup
            // NOTE: We skip cache if we are switching modes, but for initial load okay.
            // Actually, with the new mode logic, valid cache might be wrong mode.
            // For now, let's just trigger fresh fetch to be safe and simple.

            // 2. Always fetch fresh data on mount to respect mode
            fetchFreshData(true);
        };

        fetchPotentialMatches();
    }, [fetchFreshData]);

    // Fetch and subscribe to notifications - Handled by Context now
    // useEffect(() => { ... }, [currentUser]);

    // No more client-side filtering needed!
    const filteredQueue = queue;

    const currentProfile = filteredQueue[currentIndex];
    const nextProfile = filteredQueue[currentIndex + 1];
    const thirdProfile = filteredQueue[currentIndex + 2];

    // Preload upcoming images when current index changes
    useEffect(() => {
        const upcomingProfiles = filteredQueue.slice(currentIndex, currentIndex + 4);
        preloadImages(upcomingProfiles);
    }, [currentIndex, filteredQueue, preloadImages]);

    // Attach non-passive touchmove to card for reliable preventDefault on mobile
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        const onTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                e.preventDefault();
            }
        };
        card.addEventListener('touchmove', onTouchMove, { passive: false });
        return () => card.removeEventListener('touchmove', onTouchMove);
    }, [isDragging, currentProfile]);

    // Enhanced touch handlers with spring physics feel
    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setStartX(clientX);
        setStartY(clientY);
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;
        // Prevent browser scroll/refresh while swiping
        if ('touches' in e) {
            e.preventDefault();
        }
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        // Spring-like resistance at edges
        const resistance = 0.8;
        setDragX(deltaX * resistance);
        setDragY(deltaY * 0.3);

        // Update swipe direction for background effect
        if (deltaX > 50) setSwipeDirection('right');
        else if (deltaX < -50) setSwipeDirection('left');
        else setSwipeDirection(null);
    };

    const endSwipe = () => {
        setIsDragging(false);
        const threshold = window.innerWidth * 0.2;

        if (dragX > threshold) {
            handleSwipe('right');
        } else if (dragX < -threshold) {
            handleSwipe('left');
        } else {
            // Spring back animation
            setDragX(0);
            setDragY(0);
            setSwipeDirection(null);
        }
    };

    const handleSwipe = async (direction: 'left' | 'right') => {
        if (!currentProfile || !currentUser || !supabase || isSwiping) return;

        setIsSwiping(true); // Lock to prevent double-taps

        const targetId = currentProfile.id;
        const action = direction === 'right' ? 'like' : 'pass';

        // If in recycle mode, swiping left just touches the timestamp to move to back of queue
        // Swiping right moves to likes


        // Cinematic exit animation
        const offScreenX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
        setDragX(offScreenX);
        setDragY(direction === 'right' ? -100 : 100);

        // Show success burst for likes
        if (direction === 'right') {
            analytics.swipeRight();
            setShowSuccessBurst(true);
            setTimeout(() => setShowSuccessBurst(false), 600);
        } else {
            analytics.swipeLeft();
        }

        setTimeout(async () => {
            setDragX(0);
            setDragY(0);
            setSwipeDirection(null);

            // 1. UPDATE STATE & CACHE (Optimistic)
            const nextQueue = queue.filter(p => p.id !== targetId);
            setQueue(nextQueue);

            // USE SAFE SET ITEM HERE to prevent crash if storage is full
            safeSetItem(PROFILES_CACHE_KEY, JSON.stringify(nextQueue));

            // 2. UNLOCK UI IMMEDIATELY
            setIsSwiping(false);

            // 3. SEND TO DB (Background)
            try {
                // Use UPSERT to handle recycling (re-swiping on previously passed users)
                const { error: swipeError } = await supabase
                    .from('swipes')
                    .upsert({
                        liker_id: currentUser.id,
                        target_id: targetId,
                        action: action,
                        created_at: new Date().toISOString()
                    }, { onConflict: 'liker_id, target_id' });

                if (swipeError) console.error('Swipe error:', swipeError);
            } catch (err) {
                console.error('Swipe logic error:', err);
            }
        }, 200);
    };

    // Calculate 3D transforms
    const rotateY = (dragX / window.innerWidth) * 25;
    const rotateZ = (dragX / window.innerWidth) * 15;
    const scale = isDragging ? 1.02 : 1;
    const likeOpacity = Math.max(0, Math.min((dragX - 30) / 80, 1));
    const nopeOpacity = Math.max(0, Math.min((-dragX - 30) / 80, 1));

    if (!currentUser) return null;

    return (
        <div className="h-full w-full bg-transparent flex flex-col relative overflow-hidden select-none touch-none">

            {/* === REACTIVE BACKGROUND === */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Reactive blob - shifts with swipe direction */}
                <div
                    className="absolute top-[-30%] left-[-30%] w-[80%] h-[80%] rounded-full blur-[120px] transition-all duration-500 ease-out"
                    style={{
                        background: swipeDirection === 'right'
                            ? 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)'
                            : swipeDirection === 'left'
                                ? 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(255,0,127,0.08) 0%, transparent 70%)',
                        transform: `translate(${dragX * 0.1}px, ${dragY * 0.1}px)`
                    }}
                />

                {/* Secondary ambient blob */}
                <div
                    className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[100px] bg-gradient-to-t from-purple-900/10 to-transparent transition-transform duration-700"
                    style={{
                        transform: `translate(${-dragX * 0.05}px, ${-dragY * 0.05}px)`
                    }}
                />

                {/* Floating particles */}
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-neon/40 rounded-full animate-float-up" style={{ animationDelay: '0s' }} />
                <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-purple-400/40 rounded-full animate-float-up" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-400/30 rounded-full animate-float-up" style={{ animationDelay: '4s' }} />
            </div>

            {/* === SUCCESS BURST EFFECT === */}
            {showSuccessBurst && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                    <div className="relative">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-3 h-3 bg-neon rounded-full animate-burst-out"
                                style={{
                                    transform: `rotate(${i * 30}deg) translateY(-20px)`,
                                    animationDelay: `${i * 30}ms`
                                }}
                            />
                        ))}
                        <Heart className="w-16 h-16 text-neon fill-neon animate-pulse-fast drop-shadow-[0_0_30px_rgba(255,0,127,0.8)]" />
                    </div>
                </div>
            )}

            {/* === TOP HEADER === */}
            <div className="w-full px-5 py-4 flex items-center justify-between gap-4 z-30 relative">
                <div className="flex items-center gap-2">
                    <Ghost className={`w-7 h-7 drop-shadow-[0_0_12px_rgba(255,0,127,0.6)] ${isRecycleMode ? 'text-yellow-400' : 'text-neon'}`} />
                    <span className="text-xl font-black text-white tracking-tighter uppercase hidden sm:block">
                        {isRecycleMode ? 'Second Chance' : 'Discover'}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Premium Filter Toggle */}
                    <div className="flex bg-black/60 backdrop-blur-2xl rounded-full p-1 border border-white/10 shadow-2xl">
                        <button
                            onClick={() => setFilterMode('campus')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase transition-all duration-300 ${filterMode === 'campus'
                                ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <School className="w-3.5 h-3.5" />
                            Campus
                        </button>
                        <button
                            onClick={() => setFilterMode('global')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase transition-all duration-300 ${filterMode === 'global'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            Global
                        </button>
                    </div>

                    {/* Notification Button - Now rightmost for better mobile reach */}
                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative p-2.5 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 text-gray-400 hover:text-neon transition-all hover:border-neon/30 hover:scale-105 active:scale-95"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-neon text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* === MAIN CONTENT === */}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full px-4 min-h-0 pb-20 md:pb-0">

                {/* LOADING STATE - Skeleton Card */}
                {isLoading ? (
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        style={{ perspective: '1200px' }}
                    >
                        <div className="relative w-full max-w-[360px] md:max-w-[420px] h-full max-h-[580px] md:max-h-[620px]">
                            {/* Skeleton Card */}
                            <div className="absolute top-0 bottom-24 inset-x-0 rounded-[28px] overflow-hidden z-10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)] bg-gray-900 border border-gray-800">
                                {/* Skeleton Image */}
                                <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 animate-pulse" />

                                {/* Skeleton Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-40% to-black pointer-events-none" />

                                {/* Loading Quote */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6 text-center z-20">
                                    <p className="text-white/70 font-serif italic text-lg animate-pulse bg-black/60 px-6 py-3 rounded-full backdrop-blur-md shadow-2xl border border-white/10">“{quote}”</p>
                                </div>

                                {/* Skeleton Text at Bottom */}
                                <div className="absolute bottom-0 inset-x-0 p-5 space-y-3">
                                    {/* Name skeleton */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-32 bg-gray-700 rounded-lg animate-pulse" />
                                        <div className="h-6 w-10 bg-gray-700 rounded-lg animate-pulse" />
                                    </div>
                                    {/* University skeleton */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
                                        <div className="h-4 w-48 bg-gray-700 rounded animate-pulse" />
                                    </div>
                                    {/* Distance skeleton */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
                                        <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            {/* Skeleton Action Buttons */}
                            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-6 z-20 h-20 items-center">
                                <div className="w-16 h-16 bg-gray-800 rounded-full animate-pulse border border-gray-700" />
                                <div className="w-16 h-16 bg-gray-800 rounded-full animate-pulse border border-gray-700" />
                            </div>
                        </div>
                    </div>
                ) : !currentProfile ? (
                    /* EMPTY STATE - Only shown when NOT loading */
                    <div className="text-center animate-fade-in z-20">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-700 mx-auto shadow-2xl">
                            <Ghost className="w-10 h-10 text-gray-600" />
                        </div>
                        <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
                            {filterMode === 'campus' ? 'Campus Quiet' : 'Zone Empty'}
                        </h2>
                        <p className="text-gray-500 text-sm max-w-xs mb-8 mx-auto leading-relaxed">
                            {filterMode === 'campus'
                                ? 'No more students from your university. Try Global or review who you skipped!'
                                : 'No more profiles available right now.'}
                        </p>
                        <div className="flex flex-col gap-3">
                            {filterMode === 'campus' && (
                                <button
                                    onClick={() => setFilterMode('global')}
                                    className="px-6 py-3 bg-gradient-to-r from-neon to-purple-600 text-white rounded-full font-bold text-sm transition-all hover:shadow-[0_0_30px_rgba(255,0,127,0.4)] hover:scale-105 active:scale-95"
                                >
                                    Switch to Global
                                </button>
                            )}

                            <button
                                onClick={fetchSkippedProfiles}
                                className="px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-full font-bold text-sm transition-all hover:bg-gray-700 hover:text-white hover:border-gray-500 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Ghost className="w-4 h-4" /> Review Skipped Profiles
                            </button>
                        </div>
                    </div>
                ) : (
                    /* === CARD CONTAINER === */
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        style={{ perspective: '1200px' }}
                    >
                        {/* Main Card Area */}
                        <div className="relative w-full max-w-[360px] md:max-w-[420px] h-full max-h-[580px] md:max-h-[620px]">

                            {/* Background card stack */}
                            {thirdProfile && (
                                <div className="absolute top-6 bottom-20 inset-x-0 bg-gray-900/50 rounded-[28px] transform scale-[0.88] translate-y-6 opacity-30 border border-gray-800/50 pointer-events-none overflow-hidden blur-[1px]">
                                    <img src={thirdProfile.avatar} className="w-full h-full object-cover opacity-40 grayscale" alt="" />
                                </div>
                            )}
                            {nextProfile && (
                                <div className="absolute top-3 bottom-16 inset-x-0 bg-gray-900/80 rounded-[28px] transform scale-[0.94] translate-y-3 opacity-50 border border-gray-800 pointer-events-none overflow-hidden">
                                    <img src={nextProfile.avatar} className="w-full h-full object-cover opacity-60 grayscale-[50%]" alt="" />
                                </div>
                            )}

                            {/* === ACTIVE CARD === */}
                            <div
                                ref={cardRef}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={endSwipe}
                                onMouseDown={handleTouchStart}
                                onMouseMove={handleTouchMove}
                                onMouseUp={endSwipe}
                                onMouseLeave={() => isDragging && endSwipe()}
                                style={{
                                    transform: `translateX(${dragX}px) translateY(${dragY}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                                    transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    transformStyle: 'preserve-3d',
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                }}
                                className="absolute top-0 bottom-24 inset-x-0 rounded-[28px] overflow-hidden z-10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)]"
                            >
                                {/* Card glow */}
                                <div
                                    className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-200 rounded-[28px]"
                                    style={{
                                        boxShadow: swipeDirection === 'right'
                                            ? 'inset 0 0 80px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.3)'
                                            : swipeDirection === 'left'
                                                ? 'inset 0 0 80px rgba(239,68,68,0.4), 0 0 60px rgba(239,68,68,0.3)'
                                                : 'none'
                                    }}
                                />

                                {/* Image */}
                                <img
                                    src={currentProfile.avatar}
                                    alt="Profile"
                                    className="w-full h-full object-cover pointer-events-none"
                                    draggable={false}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent via-40% to-black pointer-events-none" />

                                {/* LIKE Stamp */}
                                <div
                                    className="absolute top-8 left-6 z-30 transition-all duration-200"
                                    style={{ opacity: likeOpacity, transform: `scale(${0.8 + likeOpacity * 0.4}) rotate(-12deg)` }}
                                >
                                    <div className="border-[5px] border-green-400 text-green-400 font-black text-3xl px-3 py-1.5 rounded-lg bg-green-400/10 backdrop-blur-sm shadow-[0_0_40px_rgba(34,197,94,0.6)]">LIKE</div>
                                </div>

                                {/* NOPE Stamp */}
                                <div
                                    className="absolute top-8 right-6 z-30 transition-all duration-200"
                                    style={{ opacity: nopeOpacity, transform: `scale(${0.8 + nopeOpacity * 0.4}) rotate(12deg)` }}
                                >
                                    <div className="border-[5px] border-red-400 text-red-400 font-black text-3xl px-3 py-1.5 rounded-lg bg-red-400/10 backdrop-blur-sm shadow-[0_0_40px_rgba(239,68,68,0.6)]">NOPE</div>
                                </div>

                                {/* === TINDER-STYLE BOTTOM TEXT === */}
                                <div className="absolute bottom-0 inset-x-0 p-5 text-white pointer-events-none">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                                            {currentProfile.realName ? currentProfile.realName.split(' ')[0] : currentProfile.anonymousId}
                                        </h1>
                                        {getAge(currentProfile.dob) && (
                                            <span className="text-xl md:text-2xl font-normal text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                                {getAge(currentProfile.dob)}
                                            </span>
                                        )}
                                        {currentProfile.gender && (
                                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 drop-shadow-lg">
                                                {currentProfile.gender}
                                            </span>
                                        )}
                                        {currentProfile.isVerified && (
                                            <CheckCircle2 className="w-5 h-5 text-blue-400 fill-blue-400/20 drop-shadow-lg" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-200">
                                        <GraduationCap className="w-4 h-4 drop-shadow-lg" />
                                        <span className="drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">{currentProfile.university}</span>
                                    </div>
                                    {(currentProfile.branch || currentProfile.year) && (
                                        <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-300">
                                            <School className="w-4 h-4 drop-shadow-lg" />
                                            <span className="drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                                                {[currentProfile.branch, currentProfile.year].filter(Boolean).join(' • ')}
                                            </span>
                                        </div>
                                    )}
                                    {currentProfile.lookingFor && currentProfile.lookingFor.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {currentProfile.lookingFor.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neon/20 text-neon border border-neon/30 backdrop-blur-sm drop-shadow-lg">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* === ACTION BUTTONS === */}
                            <div className="absolute bottom-0 inset-x-0 flex justify-center gap-6 z-20 h-20 items-center pb-2">
                                <button
                                    onClick={() => handleSwipe('left')}
                                    disabled={isSwiping}
                                    className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl border border-gray-700 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all duration-300 active:scale-95 shadow-xl disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <X className="w-7 h-7" strokeWidth={3} />
                                </button>

                                <button
                                    onClick={() => handleSwipe('right')}
                                    disabled={isSwiping}
                                    className="w-16 h-16 bg-gradient-to-br from-neon to-pink-600 backdrop-blur-xl border border-neon/30 rounded-full flex items-center justify-center text-white hover:scale-110 hover:shadow-[0_0_40px_rgba(255,0,127,0.5)] transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(255,0,127,0.3)] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <Heart className="w-7 h-7 fill-current" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CSS for custom animations */}
            <style>{`
                @keyframes burst-out {
                    0% { transform: rotate(var(--rotation)) translateY(-20px) scale(1); opacity: 1; }
                    100% { transform: rotate(var(--rotation)) translateY(-80px) scale(0); opacity: 0; }
                }
                .animate-burst-out {
                    animation: burst-out 0.6s ease-out forwards;
                }
                @keyframes pulse-fast {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                .animate-pulse-fast {
                    animation: pulse-fast 0.3s ease-in-out 2;
                }
            `}</style>
        </div >
    );
};