import { useState, useEffect } from "react";
import { Youtube, Upload, FileText, Loader2, CheckCircle, AlertCircle, BookOpen, List, HelpCircle, Play, ExternalLink, Share2, Download, Bookmark, AudioLines } from "lucide-react";
import QuizComponent from "./QuizComponent";
import PdfChatComponent from "./PdfChatComponent";
import LanguageSelector from "./LanguageSelector";

export default function Popup() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedProcessingOptions, setSelectedProcessingOptions] = useState({
    transcript: true,
    summary: true,
    notes: false,
    quiz: false
  });
  const [apiStatus, setApiStatus] = useState({
    loading: false,
    success: false,
    error: null,
    data: null
  });
  const [activeResultTab, setActiveResultTab] = useState("summary");

  // Base API URL - update with your actual API URL if different
  const API_BASE_URL = "http://127.0.0.1:8000";

  // Extract YouTube ID from URL
  const extractVideoId = (url) => {
    if (!url) return null;

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Get YouTube video thumbnail
  useEffect(() => {
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      const videoData = {
        id: videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`
      };
      setVideoPreview(videoData);
    } else {
      setVideoPreview(null);
    }
  }, [youtubeUrl]);

  const handleProcessingOptionChange = (option) => {
    setSelectedProcessingOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const resetState = () => {
    setApiStatus({
      loading: false,
      success: false,
      error: null,
      data: null
    });
    setProcessing(false);
    setVideoPreview(null);
    setYoutubeUrl("");
    setUploadedFile(null);
  };

  const processYoutubeVideo = async () => {
    if (!youtubeUrl) return;

    setApiStatus({
      loading: true,
      success: false,
      error: null,
      data: null
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/full-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process video');
      }

      const data = await response.json();
      setApiStatus({
        loading: false,
        success: true,
        error: null,
        data: data
      });
    } catch (error) {
      setApiStatus({
        loading: false,
        success: false,
        error: error.message,
        data: null
      });
    }
  };

  const handleVideoTranscription = async (file) => {
    if (!file) return;

    setApiStatus({
      loading: true,
      success: false,
      error: null,
      data: null
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to transcribe media');
      }

      const data = await response.json();

      // Format the data to match our expected structure
      const formattedData = {
        metadata: {
          title: file.name,
          channel: "Local Upload",
          views: "N/A",
          likes: "N/A",
        },
        summary: data.Summary || "No summary available",
        transcript_preview: data["Full Transcription"] || "No transcript available"
      };

      setApiStatus({
        loading: false,
        success: true,
        error: null,
        data: formattedData
      });
    } catch (error) {
      setApiStatus({
        loading: false,
        success: false,
        error: error.message || "An error occurred during transcription",
        data: null
      });
    }
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);

      if (type === 'document' && file.type === 'application/pdf') {
        // For PDF documents, we'll use the chat interface
        setProcessing(true);
        // Don't need to do anything else here, the PDF component will handle it
      } else if (type === 'quick-process' || type === 'video' || type === 'audio') {
        setProcessing(true);

        if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
          handleVideoTranscription(file);
        } else {
          // For other documents or files, use placeholder for now
          setApiStatus({
            loading: false,
            success: true,
            error: null,
            data: {
              metadata: {
                title: file.name,
                channel: "Local Upload",
                views: "N/A",
                likes: "N/A",
              },
              summary: `This is a placeholder summary for your uploaded ${type}. In a production version, the file would be processed by the backend API.`,
              transcript_preview: `Placeholder transcript for ${file.name}...`
            }
          });
        }
      }
    }
  };

  const handleSubmit = () => {
    if (selectedOption === 'youtube') {
      processYoutubeVideo();
    } else if (selectedOption === 'video' || selectedOption === 'audio') {
      if (uploadedFile) {
        handleVideoTranscription(uploadedFile);
      }
    } else if (selectedOption === 'document') {
      // Document processing placeholder
      if (uploadedFile && uploadedFile.type !== 'application/pdf') {
        setApiStatus({
          loading: false,
          success: true,
          error: null,
          data: {
            metadata: {
              title: uploadedFile.name,
              channel: "Local Upload",
              views: "N/A",
              likes: "N/A",
            },
            summary: `This is a placeholder summary for your uploaded document. In a production version, the file would be processed by the backend API.`,
            transcript_preview: `Placeholder transcript for ${uploadedFile.name}...`
          }
        });
      }
    }
  };

  const renderResults = () => {
    const { data } = apiStatus;
    if (!data) return null;


    console.log(data);

    return (
      <div className="relative min-h-screen max-w-96 p-2 mt-6 bg-white rounded-lg shadow-md overflow-hidden">
        {/* Video/Content Info Header */}
        {/* <LanguageSelector /> */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 p-4 text-white">
          <h3 className="font-semibold text-lg">{data.metadata?.title || "Content Results"}</h3>
          <p className="text-sm opacity-90">{data.metadata?.channel || ""}</p>
          <div className="flex gap-2 mt-2 text-xs">
            {data.metadata?.views && data.metadata?.views !== "N/A" && (
              <span className="bg-white/20 px-2 py-1 rounded-full">
                {parseInt(data.metadata.views).toLocaleString()} views
              </span>
            )}
            {data.metadata?.likes && data.metadata?.likes !== "N/A" && (
              <span className="bg-white/20 px-2 py-1 rounded-full">
                {parseInt(data.metadata.likes).toLocaleString()} likes
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {selectedProcessingOptions.summary && (
            <button
              className={`flex-1 py-2 px-4 text-xs font-medium ${activeResultTab === 'summary'
                ? 'text-violet-700 border-b-2 border-violet-600'
                : 'text-gray-600 hover:text-violet-600'}`}
              onClick={() => setActiveResultTab('summary')}
            >
              <div className="flex items-center justify-center gap-1">
                <BookOpen size={16} />
                <span>Summary</span>
              </div>
            </button>
          )}
          {selectedProcessingOptions.transcript && (
            <button
              className={`flex-1 py-2 px-4 text-xs font-medium ${activeResultTab === 'transcript'
                ? 'text-violet-700 border-b-2 border-violet-600'
                : 'text-gray-600 hover:text-violet-600'}`}
              onClick={() => setActiveResultTab('transcript')}
            >
              <div className="flex items-center justify-center gap-1">
                <FileText size={16} />
                <span>Transcript</span>
              </div>
            </button>
          )}
          {selectedProcessingOptions.notes && (
            <button
              className={`flex-1 py-2 px-4 text-xs font-medium ${activeResultTab === 'notes'
                ? 'text-violet-700 border-b-2 border-violet-600'
                : 'text-gray-600 hover:text-violet-600'}`}
              onClick={() => setActiveResultTab('notes')}
            >
              <div className="flex items-center justify-center gap-1">
                <List size={16} />
                <span>Notes</span>
              </div>
            </button>
          )}
          {selectedProcessingOptions.quiz && (
            <button
              className={`flex-1 py-2 px-4 text-xs font-medium ${activeResultTab === 'quiz'
                ? 'text-violet-700 border-b-2 border-violet-600'
                : 'text-gray-600 hover:text-violet-600'}`}
              onClick={() => setActiveResultTab('quiz')}
            >
              <div className="flex items-center justify-center gap-1">
                <HelpCircle size={16} />
                <span>Quiz</span>
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {activeResultTab === 'summary' && (
            <div className="prose prose-sm max-w-none text-gray-700">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Content Summary</h4>
              <p className="whitespace-pre-line">{data.summary || "No summary available"}</p>
            </div>
          )}

          {activeResultTab === 'transcript' && (
            <div className="prose prose-sm max-w-none text-gray-700">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Transcript</h4>
              <p className="whitespace-pre-line">{data.transcript_preview || "Full transcript not available"}</p>
              {data.transcript_preview && data.transcript_preview.endsWith("...") && (
                <button className="mt-2 text-violet-600 text-sm font-medium hover:underline">
                  Show full transcript
                </button>
              )}
            </div>
          )}

          {activeResultTab === 'notes' && (
            <div className="prose prose-sm max-w-none text-gray-700">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Key Notes</h4>
              {/* <p>Key notes feature will be available in the next update.</p> */}
              {
                data?.short_notes ? (
                  <p>{data.short_notes}</p>
                ) : (
                  <p>Key notes feature will be available in the next update.</p>
                )
              }
            </div>
          )}

          {activeResultTab === 'quiz' && (
            <div className="prose prose-sm max-w-none text-gray-700">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Quiz Questions</h4>
              {data.questions ? (
                <div>
                  <QuizComponent quizData={data.questions} />
                </div>
              ) : (
                <p>No quiz questions available.</p>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="bg-gray-50 p-3 flex justify-between border-t">
          <button
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            onClick={resetState}
          >
            <span>New Analysis</span>
          </button>
          <div className="flex gap-2">
            <button className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1 px-2 py-1 rounded">
              <Share2 size={16} />
              <span>Share</span>
            </button>
            <button className="text-sm text-white bg-violet-600 px-3 py-1 rounded hover:bg-violet-700 flex items-center gap-1">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 rounded-full">
        {/* Professional Header with Violet Theme */}
        <div className="relative overflow-hidden rounded-xl mb-6 bg-white shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-purple-500/20 animate-gradient"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Smart Sidebar</h1>
                <p className="text-gray-600">AI-powered content analyzer</p>
                <LanguageSelector />
              </div>
              <div className="bg-violet-600 text-white p-2 rounded-lg shadow-md">
                <Bookmark size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {!apiStatus.success ? (
            <>
              {/* Option Boxes in Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* YouTube URL Box */}
                <div
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-md
                    ${selectedOption === 'youtube'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'}`}
                  onClick={() => setSelectedOption('youtube')}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className={`p-3 rounded-full ${selectedOption === 'youtube' ? 'bg-violet-100' : 'bg-gray-100 group-hover:bg-violet-50'}`}>
                      <Youtube className={`${selectedOption === 'youtube' ? 'text-violet-600' : 'text-red-600'}`} size={24} />
                    </div>
                    <h2 className="font-semibold text-sm text-gray-800">YouTube URL</h2>
                  </div>
                </div>

                {/* Upload Video Box */}
                <div
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-md
                    ${selectedOption === 'video'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'}`}
                  onClick={() => setSelectedOption('video')}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className={`p-3 rounded-full ${selectedOption === 'video' ? 'bg-violet-100' : 'bg-gray-100 group-hover:bg-violet-50'}`}>
                      <Upload className={`${selectedOption === 'video' ? 'text-violet-600' : 'text-indigo-600'}`} size={24} />
                    </div>
                    <h2 className="font-semibold text-sm text-gray-800">Upload Video/Audio</h2>
                  </div>
                </div>

                {/* Upload Audio Box */}
                {/* <div 
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-md
                    ${selectedOption === 'audio' 
                      ? 'border-violet-500 bg-violet-50' 
                      : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'}`}
                  onClick={() => setSelectedOption('audio')}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className={`p-3 rounded-full ${selectedOption === 'audio' ? 'bg-violet-100' : 'bg-gray-100 group-hover:bg-violet-50'}`}>
                      <AudioLines className={`${selectedOption === 'audio' ? 'text-violet-600' : 'text-indigo-600'}`} size={24} />
                    </div>
                    <h2 className="font-semibold text-sm text-gray-800">Upload Audio</h2>
                  </div>
                </div> */}

                {/* Upload Document Box */}
                <div
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-md
                    ${selectedOption === 'document'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'}`}
                  onClick={() => setSelectedOption('document')}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className={`p-3 rounded-full ${selectedOption === 'document' ? 'bg-violet-100' : 'bg-gray-100 group-hover:bg-violet-50'}`}>
                      <FileText className={`${selectedOption === 'document' ? 'text-violet-600' : 'text-indigo-600'}`} size={24} />
                    </div>
                    <h2 className="font-semibold text-sm text-gray-800">Upload Document</h2>
                  </div>
                </div>
                <LanguageSelector />
              </div>

              {/* Input Section */}
              {selectedOption && (
                <div className="mb-6 animate-fadeIn">
                  <LanguageSelector />
                  {selectedOption === 'youtube' && (
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Paste YouTube URL here"
                          className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Youtube className="text-red-600" size={18} />
                        </div>
                      </div>

                      {/* YouTube Preview */}
                      {videoPreview && (
                        <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 animate-fadeIn">
                          <div className="relative pb-[56.25%] bg-black"> {/* 16:9 aspect ratio */}
                            <img
                              src={videoPreview.thumbnail}
                              alt="Video thumbnail"
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                // If maxresdefault fails, try hqdefault
                                e.target.src = `https://img.youtube.com/vi/${videoPreview.id}/hqdefault.jpg`;
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/50 p-2 rounded-full">
                                <Play className="text-white" size={32} />
                              </div>
                            </div>
                          </div>
                          <div className="p-3 flex justify-between items-center">
                            <div className="text-sm text-gray-700 font-medium line-clamp-1">
                              YouTube Video Preview
                            </div>
                            <a
                              href={`https://www.youtube.com/watch?v=${videoPreview.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-600 hover:text-violet-700 text-sm flex items-center gap-1"
                            >
                              <ExternalLink size={14} />
                              <span>Open</span>
                            </a>
                          </div>
                        </div>
                      )}

                      <button
                        className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${apiStatus.loading ?
                            'bg-violet-400 cursor-not-allowed' :
                            'bg-violet-600 hover:bg-violet-700 text-white'
                          }`}
                        onClick={() => setProcessing(true)}
                        disabled={apiStatus.loading || !videoPreview}
                      >
                        {apiStatus.loading ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>Process Video</span>
                        )}
                      </button>
                    </div>
                  )}

                  {selectedOption === 'video' && (
                    <div className="border-2 border-dashed border-violet-300 rounded-lg p-8 text-center hover:bg-violet-50 transition-colors">
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        id="video-upload"
                        onChange={(e) => handleFileUpload(e, 'video')}
                      />
                      <label
                        htmlFor="video-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <Upload className="text-violet-500" size={32} />
                        <span className="text-sm text-gray-700 font-medium">Click to upload or drag and drop</span>
                        <span className="text-xs text-gray-500">MP4, AVI, MOV up to 500MB</span>
                      </label>
                    </div>
                  )}

                  {selectedOption === 'audio' && (
                    <div className="border-2 border-dashed border-violet-300 rounded-lg p-8 text-center hover:bg-violet-50 transition-colors">
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        id="audio-upload"
                        onChange={(e) => handleFileUpload(e, 'audio')}
                      />
                      <label
                        htmlFor="audio-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <AudioLines className="text-violet-500" size={32} />
                        <span className="text-sm text-gray-700 font-medium">Click to upload or drag and drop</span>
                        <span className="text-xs text-gray-500">MP3, WAV, M4A up to 100MB</span>
                      </label>
                    </div>
                  )}

                  {selectedOption === 'document' && (
                    <div className="animate-fadeIn">
                      {!processing ? (
                        <div className="border-2 border-dashed border-violet-300 rounded-lg p-8 text-center hover:bg-violet-50 transition-colors">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            className="hidden"
                            id="document-upload"
                            onChange={(e) => handleFileUpload(e, 'document')}
                          />
                          <label
                            htmlFor="document-upload"
                            className="cursor-pointer flex flex-col items-center gap-3"
                          >
                            <FileText className="text-violet-500" size={32} />
                            <span className="text-sm text-gray-700 font-medium">Click to upload or drag and drop</span>
                            <span className="text-xs text-gray-500">PDF, DOC, DOCX, TXT up to 10MB</span>
                          </label>
                        </div>
                      ) : (
                        <div className="h-[500px] bg-white rounded-lg shadow-lg overflow-hidden">
                          <PdfChatComponent />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Processing Options */}
              {!(selectedOption === 'document') && processing && !apiStatus.loading && !apiStatus.success && (videoPreview || uploadedFile ) && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-6 rounded-lg border border-violet-100">
                    <h3 className="font-medium text-gray-800 mb-4">Processing Options</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center space-x-3 p-3 rounded-lg border ${selectedProcessingOptions.transcript ? 'bg-violet-100 border-violet-300' : 'bg-white border-gray-200'} hover:border-violet-300 transition-colors cursor-pointer`}>
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-violet-600 rounded"
                          checked={selectedProcessingOptions.transcript}
                          onChange={() => handleProcessingOptionChange('transcript')}
                        />
                        <span className="text-sm text-gray-700">Generate Transcript</span>
                      </label>
                      <label className={`flex items-center space-x-3 p-3 rounded-lg border ${selectedProcessingOptions.summary ? 'bg-violet-100 border-violet-300' : 'bg-white border-gray-200'} hover:border-violet-300 transition-colors cursor-pointer`}>
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-violet-600 rounded"
                          checked={selectedProcessingOptions.summary}
                          onChange={() => handleProcessingOptionChange('summary')}
                        />
                        <span className="text-sm text-gray-700">Create Summary</span>
                      </label>
                      <label className={`flex items-center space-x-3 p-3 rounded-lg border ${selectedProcessingOptions.notes ? 'bg-violet-100 border-violet-300' : 'bg-white border-gray-200'} hover:border-violet-300 transition-colors cursor-pointer`}>
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-violet-600 rounded"
                          checked={selectedProcessingOptions.notes}
                          onChange={() => handleProcessingOptionChange('notes')}
                        />
                        <span className="text-sm text-gray-700">Generate Short Notes</span>
                      </label>
                      <label className={`flex items-center space-x-3 p-3 rounded-lg border ${selectedProcessingOptions.quiz ? 'bg-violet-100 border-violet-300' : 'bg-white border-gray-200'} hover:border-violet-300 transition-colors cursor-pointer`}>
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-violet-600 rounded"
                          checked={selectedProcessingOptions.quiz}
                          onChange={() => handleProcessingOptionChange('quiz')}
                        />
                        <span className="text-sm text-gray-700">Create Quiz</span>
                      </label>
                    </div>
                    <button
                      className="mt-5 w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
                      onClick={handleSubmit}
                      disabled={apiStatus.loading}
                    >
                      {apiStatus.loading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Play size={18} />
                          <span>Start Processing</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* API Error Message */}
              {apiStatus.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-red-700">Error Processing Content</h4>
                    <p className="text-sm text-red-600">{apiStatus.error}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Show results when we have successful API data
            renderResults()
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500 flex justify-between items-center">
          <p>
            &copy; 2022 Smart Sidebar. All rights reserved.
          </p>
          <div className="flex gap-2">
            <a href="#" className="hover:text-gray-700">Privacy Policy</a>
            <a href="#" className="hover:text-gray-700">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}