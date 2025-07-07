import React, { useState } from 'react';
import { X, Mic, FileText, BarChart3, Download, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingWalkthrough: React.FC<OnboardingWalkthroughProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Interview Intelligence",
      content: "AI-powered interview coaching that helps you master your interview skills with personalized feedback.",
      icon: BarChart3,
      highlight: "Get started in 4 simple steps"
    },
    {
      title: "1. Record or Upload",
      content: "Practice with real interview questions or upload your existing recordings for analysis.",
      icon: Mic,
      highlight: "Supports all major audio formats"
    },
    {
      title: "2. AI Transcription",
      content: "Our advanced AI converts your speech to text and lets you review and edit for accuracy.",
      icon: FileText,
      highlight: "Powered by OpenAI Whisper"
    },
    {
      title: "3. Smart Analysis",
      content: "Get detailed feedback on confidence, clarity, professionalism, and relevance with role-specific insights.",
      icon: BarChart3,
      highlight: "Tailored for your target role"
    },
    {
      title: "4. Download Report",
      content: "Export detailed PDF reports for your records, mentoring sessions, or interview preparation.",
      icon: Download,
      highlight: "Professional-grade reports"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center space-y-6">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Icon className="w-10 h-10 text-white" />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
            <p className="text-gray-600 leading-relaxed">{step.content}</p>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">{step.highlight}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-0 disabled:cursor-default"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </span>

            <button
              onClick={nextStep}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWalkthrough;