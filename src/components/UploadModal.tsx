import { useState } from "react";
import { X, Upload, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

const UploadModal = ({ open, onClose }: UploadModalProps) => {
  const [artistName, setArtistName] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = () => {
    // Mock submit
    onClose();
    setArtistName("");
    setSongTitle("");
    setFile(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Upload Song</h2>
            <button onClick={onClose} className="p-2 text-muted-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 px-4 py-6 space-y-5 max-w-lg mx-auto w-full">
            {/* File upload */}
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-8 cursor-pointer hover:border-primary/50 transition-colors">
              {file ? (
                <>
                  <Music size={28} className="text-primary" />
                  <span className="text-sm text-foreground">{file.name}</span>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tap to select MP3</span>
                </>
              )}
              <input
                type="file"
                accept="audio/mp3,audio/mpeg"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            {/* Artist name */}
            <input
              type="text"
              placeholder="Artist Name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Song title */}
            <input
              type="text"
              placeholder="Song Title"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!file || !artistName || !songTitle}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 transition-opacity"
            >
              Post 🎵
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;
