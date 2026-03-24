import React, { useEffect, useState } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const extractYoutubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

export const AclStreamCard: React.FC = () => {
  const [ytLink, setYtLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreamLink = async () => {
      try {
        const { data, error } = await supabase
          .from('amis_streams')
          .select('yt_link')
          .eq('name', 'ACL')
          .single();

        if (data?.yt_link) {
          setYtLink(data.yt_link);
        }
      } catch (err) {
        console.error('Failed to fetch stream link:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreamLink();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-8 mb-8 bg-black/40 border border-white/10 rounded-[24px] backdrop-blur-xl">
        <Loader2 className="w-8 h-8 text-neon animate-spin" />
      </div>
    );
  }

  const videoId = ytLink ? extractYoutubeId(ytLink) : null;

  if (videoId) {
    return (
      <div className="w-full aspect-video rounded-[24px] overflow-hidden shadow-[0_0_40px_rgba(255,0,127,0.2)] border border-neon/30 relative mb-8 z-20 group">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
          title="Amity Combat League Stream"
          className="absolute inset-0 w-full h-full object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
        {/* Glow overlay effect */}
        <div className="absolute inset-0 pointer-events-none rounded-[24px] shadow-[inset_0_0_20px_rgba(255,0,127,0.2)]" />
      </div>
    );
  }

  return (
    <div className="w-full relative rounded-[24px] overflow-hidden border border-neon/20 shadow-[0_0_30px_rgba(255,0,127,0.15)] mb-8 z-20 bg-black/60 backdrop-blur-3xl group">
      {/* Background gradients */}
      <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-neon/10 blur-[80px] animate-pulse rounded-full pointer-events-none" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-[-50%] right-[-20%] w-[60%] h-[150%] bg-orange-500/10 blur-[70px] animate-pulse rounded-full pointer-events-none" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      
      <div className="relative z-10 p-6 md:p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
        <div className="relative mb-4">
          <Flame className="w-12 h-12 text-neon animate-bounce" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 bg-neon/50 blur-xl rounded-full scale-150 animate-pulse" />
        </div>
        
        <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon to-pink-400 mb-2 uppercase tracking-tight group-hover:scale-105 transition-transform duration-500">
          ACL Stream
        </h2>
        
        <p className="text-white text-base md:text-lg font-bold mb-5 tracking-wide">
          Amity Combat League <span className="text-neon mx-2">•</span> Free Fire
        </p>
        
        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          <span className="text-[10px] md:text-xs uppercase font-black tracking-widest text-gray-200">
            Stream Starting Soon
          </span>
        </div>
      </div>
    </div>
  );
};

export default AclStreamCard;
