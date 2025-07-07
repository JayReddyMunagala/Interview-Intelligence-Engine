import React from 'react';
import { Shield, Lock, Trash2, Eye } from 'lucide-react';

const PrivacyDisclosure: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-violet-50 to-indigo-50 border-t border-violet-200 mt-16">
      {/* Enhanced Privacy Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-b border-emerald-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center space-x-3">
            <Shield className="w-5 h-5 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">
              🔒 <strong>Privacy Protected:</strong> Audio and transcripts are processed temporarily and never stored permanently. 
              All analysis happens in real-time and is not saved to our servers.
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Privacy Assurance */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 mb-1">Privacy Protected</h4>
              <p className="text-sm text-emerald-700">
                Your audio is processed temporarily and never stored permanently on our servers.
              </p>
            </div>
          </div>

          {/* Data Security */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Lock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h4 className="font-bold text-violet-900 mb-1">Secure Processing</h4>
              <p className="text-sm text-violet-700">
                All transcription and analysis happens through encrypted connections with enterprise-grade security.
              </p>
            </div>
          </div>

          {/* No Tracking */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Eye className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-indigo-900 mb-1">No Tracking</h4>
              <p className="text-sm text-indigo-700">
                We don't track your personal information or share your interview content with third parties.
              </p>
            </div>
          </div>

          {/* Local Storage */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Trash2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-bold text-orange-900 mb-1">Your Control</h4>
              <p className="text-sm text-orange-700">
                Progress data is stored locally on your device. You can clear it anytime using the reset button.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 pt-6 border-t border-gray-300">
          <p className="text-center text-sm text-violet-600 font-medium">
            <strong>Interview Intelligence</strong> - AI-Powered Interview Analysis Platform. 
            Your privacy and data security are our top priorities. 
            <a href="#" className="text-violet-700 hover:text-violet-800 ml-1 underline">Learn more about our privacy practices</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyDisclosure;