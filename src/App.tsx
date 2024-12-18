import { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Bookmark as BookmarkIcon,
  Trash2,
  Upload,
  RefreshCw,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

// Utility Functions
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const MP3Player = () => {
  // Track Management
  const [tracks, setTracks] = useState<
    { file: File; name: string; url: string; type: string }[]
  >([]);
  const [currentTrack, setCurrentTrack] = useState<{
    file: File;
    name: string;
    url: string;
    type: string;
  } | null>(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Bookmark Management
  const [bookmarks, setBookmarks] = useState<
    { id: number; name: string; time: number; trackName: string }[]
  >([]);
  const [bookmarkName, setBookmarkName] = useState("");

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bookmarkInputRef = useRef<HTMLInputElement>(null);

  // Load Saved Data from LocalStorage
  useEffect(() => {
    const savedTracks = localStorage.getItem("mp3PlayerTracks");
    const savedBookmarks = localStorage.getItem("mp3PlayerBookmarks");

    if (savedTracks) {
      const parsedTracks = JSON.parse(savedTracks);
      setTracks(
        parsedTracks.map((track: { url: string }) => ({
          ...track,
          url: track.url, // Recreate object URLs if needed
        }))
      );
    }

    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }, []);

  // Save Tracks and Bookmarks to LocalStorage
  useEffect(() => {
    if (tracks.length > 0) {
      const tracksToSave = tracks.map((track) => ({
        name: track.name,
        type: track.type,
      }));
      localStorage.setItem("mp3PlayerTracks", JSON.stringify(tracksToSave));
    }
  }, [tracks]);

  useEffect(() => {
    if (bookmarks.length > 0) {
      localStorage.setItem("mp3PlayerBookmarks", JSON.stringify(bookmarks));
    }
  }, [bookmarks]);

  // Playback Methods
  const playTrack = (track: {
    file: File;
    name: string;
    url: string;
    type: string;
  }) => {
    setCurrentTrack(track);
    setIsPlaying(true);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch((error: DOMException) => {
          console.error("Error playing track:", error);
          setIsPlaying(false);
        });
      }
    }, 100);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;

    const currentIndex = tracks.findIndex((t) => t === currentTrack);
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex]);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;

    const currentIndex = tracks.findIndex((t) => t === currentTrack);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIndex]);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (audioRef.current.volume > 0) {
        audioRef.current.volume = 0;
        setVolume(0);
      } else {
        audioRef.current.volume = 1;
        setVolume(1);
      }
    }
  };

  const changePlaybackSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // Track Import Methods
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files as unknown as File[]);
    const newTracks = uploadedFiles.map((file: File) => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      type: "local",
    }));

    const updatedTracks = [...tracks, ...newTracks];
    setTracks(updatedTracks);

    if (newTracks.length > 0) {
      playTrack(newTracks[0]);
    }
  };

  // Bookmark Methods
  const addBookmark = () => {
    if (!currentTrack || !audioRef.current) return;

    const name = bookmarkName.trim() || `Bookmark ${bookmarks.length + 1}`;

    const newBookmark = {
      id: Date.now(),
      name: name,
      time: audioRef.current.currentTime,
      trackName: currentTrack.name,
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);

    // Clear input
    setBookmarkName("");
    if (bookmarkInputRef.current) {
      bookmarkInputRef.current.value = "";
    }
  };

  const goToBookmark = (bookmark: {
    id: number;
    name: string;
    time: number;
    trackName: string;
  }) => {
    const bookmarkTrack = tracks.find((t) => t.name === bookmark.trackName);

    if (bookmarkTrack) {
      if (bookmarkTrack !== currentTrack) {
        setCurrentTrack(bookmarkTrack);
      }

      if (audioRef.current) {
        audioRef.current.currentTime = bookmark.time;
        setCurrentTime(bookmark.time);

        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const removeBookmark = (bookmarkToRemove: {
    id: number;
    name: string;
    time: number;
    trackName: string;
  }) => {
    const updatedBookmarks = bookmarks.filter(
      (bookmark) => bookmark.id !== bookmarkToRemove.id
    );
    setBookmarks(updatedBookmarks);
  };

  // Clear All Data
  const clearAllData = () => {
    // Clear tracks and bookmarks
    setTracks([]);
    setBookmarks([]);
    setCurrentTrack(null);
    setIsPlaying(false);

    // Clear localStorage
    localStorage.removeItem("mp3PlayerTracks");
    localStorage.removeItem("mp3PlayerBookmarks");
  };

  // Jump Controls
  const jumpForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(
        audioRef.current.currentTime + 5,
        audioRef.current.duration
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const jumpBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - 5, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="w-1/2">
        <div className="w-full flex justify-between p-2">
          <DarkModeToggle />
          <Button variant="outline" size="icon" onClick={clearAllData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardHeader>
          <CardTitle className="text-center">
            {currentTrack ? currentTrack.name : "MP3 Player"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Audio Element */}
          {currentTrack && (
            <audio
              ref={audioRef}
              src={currentTrack.url}
              onTimeUpdate={(e) => {
                setCurrentTime((e.target as HTMLAudioElement).currentTime);
                setDuration((e.target as HTMLAudioElement).duration);
              }}
              onLoadedMetadata={(e) => {
                setDuration((e.target as HTMLAudioElement).duration);
              }}
              onEnded={nextTrack}
            />
          )}

          {/* Progress Bar */}
          <div className="mb-4 w-full">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={(value) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = value[0];
                  setCurrentTime(value[0]);
                }
              }}
            />
            <div className="w-full flex justify-between text-sm mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex justify-center items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={jumpBackward}
              disabled={!currentTrack}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={prevTrack}
              disabled={tracks.length === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              disabled={tracks.length === 0}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={nextTrack}
              disabled={tracks.length === 0}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={jumpForward}
              disabled={!currentTrack}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume and Speed Controls */}
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {volume > 0 ? <Volume2 /> : <VolumeX />}
            </Button>

            <Slider
              value={[volume * 100]}
              max={100}
              step={10}
              onValueChange={(value) => {
                const newVolume = value[0] / 100;
                setVolume(newVolume);
                if (audioRef.current) {
                  audioRef.current.volume = newVolume;
                }
              }}
            />

            <Button variant="outline" onClick={changePlaybackSpeed}>
              Speed: {playbackRate}x
            </Button>
          </div>

          {/* File Upload */}
          <div className="flex gap-4 mb-4">
            <Input
              type="file"
              multiple
              accept="audio/mp3,audio/wav,audio/ogg"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" /> Upload Tracks
            </Button>
          </div>

          {/* Playlist and Bookmarks Section */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full">
                Playlist & Bookmarks
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Playlist & Bookmarks</DialogTitle>
              </DialogHeader>

              {/* Playlist Section */}
              <div>
                <h3 className="font-semibold mb-2">Playlist</h3>
                <div className="max-h-40 overflow-y-auto border rounded">
                  {tracks.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      No tracks added
                    </div>
                  ) : (
                    tracks.map((track, index) => (
                      <div
                        key={index}
                        onClick={() => playTrack(track)}
                        className={`p-2 cursor-pointer hover:bg-accent ${
                          currentTrack === track ? "bg-primary/10" : ""
                        }`}
                      >
                        {track.name}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bookmarks Section */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Bookmarks</h3>
                <div className="flex gap-2 mb-2">
                  <Input
                    ref={bookmarkInputRef}
                    placeholder="Bookmark name (optional)"
                    onChange={(e) => setBookmarkName(e.target.value)}
                  />
                  <Button onClick={addBookmark} disabled={!currentTrack}>
                    <BookmarkIcon className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded">
                  {bookmarks.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      No bookmarks yet
                    </div>
                  ) : (
                    bookmarks.map((bookmark) => (
                      <div
                        key={bookmark.id}
                        className="flex justify-between items-center p-2 hover:bg-accent"
                      >
                        <div
                          onClick={() => goToBookmark(bookmark)}
                          className="flex-grow cursor-pointer"
                        >
                          <span className="font-bold">{bookmark.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {bookmark.trackName} - {formatTime(bookmark.time)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBookmark(bookmark)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default MP3Player;
// Custom hook for managing dark mode
const useDarkMode = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
  );

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark");

    // Add current theme class
    root.classList.add(theme);

    // Save theme to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
};

// Dark Mode Toggle Component
const DarkModeToggle = () => {
  const { theme, setTheme } = useDarkMode();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
};
