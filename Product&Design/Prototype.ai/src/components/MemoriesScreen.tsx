import React, { useState } from "react";
import {
  ChevronLeft,
  Calendar,
  Mic,
  Play,
  Pause,
  Trash2,
  Edit3,
} from "lucide-react";

interface Memory {
  id: string;
  prompt: string;
  content: string;
  type: "voice" | "text";
  created_at: string;
  updated_at: string;
}

interface MemoriesScreenProps {
  isVisible: boolean;
  memories: Memory[];
  onClose: () => void;
  onDeleteMemory: (memoryId: string) => void;
  onUpdateMemory: (
    memoryId: string,
    newContent: string,
  ) => void;
}

export default function MemoriesScreen({
  isVisible,
  memories,
  onClose,
  onDeleteMemory,
  onUpdateMemory,
}: MemoriesScreenProps) {
  const [selectedMemory, setSelectedMemory] =
    useState<Memory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);

  const handleMemoryClick = (memory: Memory) => {
    setSelectedMemory(memory);
    setEditContent(memory.content);
    setIsEditing(false);
    setPlaybackPosition(0);
    setIsPlaying(false);
  };

  const handleBackToList = () => {
    setSelectedMemory(null);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (selectedMemory) {
      onUpdateMemory(selectedMemory.id, editContent);
      setSelectedMemory({
        ...selectedMemory,
        content: editContent,
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedMemory) {
      setEditContent(selectedMemory.content);
    }
    setIsEditing(false);
  };

  const handleDeleteCurrent = () => {
    if (selectedMemory) {
      onDeleteMemory(selectedMemory.id);
      setSelectedMemory(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 1) {
      return "Today";
    } else if (diffDays === 2) {
      return "Yesterday";
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== now.getFullYear()
            ? "numeric"
            : undefined,
      });
    }
  };

  const formatDuration = (content: string) => {
    // Mock duration calculation based on content length
    const words = content.split(" ").length;
    const minutes = Math.max(1, Math.floor(words / 150)); // Assume 150 words per minute
    return `${minutes}:${Math.floor(Math.random() * 60)
      .toString()
      .padStart(2, "0")}`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Status Bar Spacer */}
      <div className="h-11 bg-white"></div>

      {selectedMemory ? (
        // Detail View
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <button
              onClick={handleBackToList}
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft
                size={20}
                className="text-gray-600"
              />
            </button>
            <h1 className="text-lg truncate mx-4 font-semibold">
              Memory Detail
            </h1>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Edit3 size={16} className="text-gray-600" />
                </button>
              )}
              <button
                onClick={handleDeleteCurrent}
                className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
            {/* Memory Info */}
            <div className="mb-6">
              <h2 className="text-xl mb-3 font-semibold">
                {selectedMemory.prompt}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>
                    {formatDate(selectedMemory.created_at)}
                  </span>
                </div>
                {selectedMemory.type === "voice" && (
                  <div className="flex items-center gap-1">
                    <Mic size={14} />
                    <span>
                      {formatDuration(selectedMemory.content)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Player for voice memories */}
            {selectedMemory.type === "voice" && !isEditing && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {Math.floor(playbackPosition / 60)}:
                    {Math.floor(playbackPosition % 60)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatDuration(selectedMemory.content)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-1 bg-gray-300 rounded-full mb-4">
                  <div
                    className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-100"
                    style={{
                      width: `${Math.min(100, (playbackPosition / 180) * 100)}%`,
                    }}
                  />
                </div>

                {/* Play Controls */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause
                        size={20}
                        className="text-gray-700"
                      />
                    ) : (
                      <Play
                        size={20}
                        className="text-gray-700 ml-0.5"
                      />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Memory Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {isEditing ? (
                <>
                  <label
                    htmlFor="memory-editor"
                    className="text-sm text-gray-600 mb-2"
                  >
                    Edit your memory
                  </label>
                  <textarea
                    id="memory-editor"
                    value={editContent}
                    onChange={(e) =>
                      setEditContent(e.target.value)
                    }
                    className="flex-1 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-y-auto"
                    placeholder="Edit your memory content..."
                    autoFocus
                    style={{
                      fontFamily: "'Shantell Sans', sans-serif",
                      fontSize: "16px",
                      lineHeight: "1.6",
                      minHeight: "200px",
                    }}
                  />
                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-center font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-center font-semibold"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="flex-1 overflow-y-auto"
                  style={{
                    fontFamily: "'Shantell Sans', sans-serif",
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#374151",
                  }}
                >
                  {selectedMemory.content}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // List View
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center px-6 py-4">
            <button
              onClick={onClose}
              className="text-blue-500 hover:underline"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold">Memories</h1>
            <div className="w-12"></div>
          </header>

          {/* Memory List */}
          <div className="flex-1 px-6 pb-6">
            {memories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No memories yet. Start recording to create
                  your first memory!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {memories.map((memory) => (
                  <button
                    key={memory.id}
                    onClick={() => handleMemoryClick(memory)}
                    className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all active:scale-98"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 pr-4">
                        {memory.prompt.length > 40
                          ? memory.prompt.substring(0, 40) +
                            "..."
                          : memory.prompt}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(memory.created_at)}
                      </span>
                    </div>

                    <p
                      className="text-gray-600 text-sm mb-3 line-clamp-2"
                      style={{
                        fontFamily: "'Shantell Sans', cursive",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {memory.content.substring(0, 120)}
                      {memory.content.length > 120 ? "..." : ""}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {memory.type === "voice" && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Mic size={12} />
                            <span>
                              {formatDuration(memory.content)}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronLeft
                        size={16}
                        className="text-gray-400 rotate-180"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}