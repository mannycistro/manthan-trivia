import { useEffect, useRef, useState } from "react";
import { ImageIcon, Music, Video, Youtube } from "lucide-react";
import { Question } from "@/types/jeopardy";
import { getMedia, isMediaRef, refToId } from "@/lib/mediaStorage";

export function EditMediaPreview({ question }: { question: Question }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [source, setSource] = useState<string>();
  const url = question.mediaUrl;
  const youtube = question.mediaType === "video" && !!url && (() => {
    try {
      const u = new URL(url);
      return (u.hostname.includes("youtu.be") && !!u.pathname.slice(1)) ||
        (u.hostname.includes("youtube.com") && (!!u.searchParams.get("v") || u.pathname.startsWith("/embed/")));
    } catch { return false; }
  })();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    setSource(undefined);
    // Videos deliberately use an icon: avoid decoding many videos at once.
    if (visible && url && question.mediaType !== "video") {
      const resolve = async () => {
        const stored = isMediaRef(url) ? await getMedia(refToId(url)) : url;
        if (!stored || cancelled) return;
        if (stored.startsWith("data:")) {
          const blob = await (await fetch(stored)).blob();
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setSource(objectUrl);
        } else {
          setSource(stored);
        }
      };
      resolve().catch(() => { if (!cancelled) setSource(undefined); });
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [visible, url, question.mediaType]);

  const Icon = youtube ? Youtube : question.mediaType === "image" ? ImageIcon : question.mediaType === "audio" ? Music : Video;
  return (
    <div ref={ref} className="flex min-h-8 w-full justify-center py-1" aria-label={`${youtube ? "YouTube" : question.mediaType} preview`}>
      {visible && source && question.mediaType === "image" ? (
        <img src={source} loading="lazy" alt="Clue media" className="h-16 max-w-full object-contain rounded" />
      ) : visible && source && question.mediaType === "audio" ? (
        <audio src={source} controls preload="none" className="h-8 w-full min-w-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} />
      ) : <Icon className="h-6 w-6" />}
    </div>
  );
}