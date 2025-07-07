import React, { useState, useEffect } from 'react';
import { Edit3, Check, X, AlertCircle } from 'lucide-react';

interface TranscriptEditorProps {
  transcript: string;
  onTranscriptChange: (newTranscript: string) => void;
  isEditable?: boolean;
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({ 
  transcript, 
  onTranscriptChange, 
  isEditable = true 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedTranscript(transcript);
    setHasChanges(false);
  }, [transcript]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onTranscriptChange(editedTranscript);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditedTranscript(transcript);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleChange = (value: string) => {
    setEditedTranscript(value);
    setHasChanges(value !== transcript);
  };

  if (!transcript) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
        <div className="flex items-center space-x-2 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">No transcript available yet. Start recording or upload an audio file.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Edit3 className="w-5 h-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">
            Interview Transcript
          </h4>
          {hasChanges && !isEditing && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Modified
            </span>
          )}
        </div>
        
        {isEditable && (
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">Cancel</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedTranscript}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Edit your transcript here..."
            />
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>Edit the transcript to ensure accuracy before analysis. This will improve feedback quality.</span>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {editedTranscript}
            </p>
          </div>
        )}
      </div>

      {/* Word count and stats */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
          <span>{editedTranscript.trim().split(/\s+/).length} words</span>
          <span>{editedTranscript.length} characters</span>
          <span>~{Math.round(editedTranscript.trim().split(/\s+/).length / 150)} min read</span>
        </div>
      </div>
    </div>
  );
};

export default TranscriptEditor;