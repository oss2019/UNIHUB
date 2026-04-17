import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function ComplaintsView({ isDarkMode }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('academic');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (subject.length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Grievance submitted:', {
        subject,
        category,
        description,
        isAnonymous,
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
      setSubmitted(true);
      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setSubject('');
        setDescription('');
        setCategory('academic');
        setIsAnonymous(false);
      }, 3000);
    }, 500);
  };

  if (submitted) {
    return (
      <div className={`p-6 rounded border text-center ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Grievance Submitted Successfully!</h3>
        <p className="text-sm opacity-70 mb-4">Your complaint has been recorded. Our team will review it shortly.</p>
        {isAnonymous && <p className="text-xs opacity-50 italic">Submitted anonymously</p>}
      </div>
    );
  }

  return (
    <div className={`p-6 rounded border ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <AlertCircle className="w-6 h-6 text-red-500" /> Complaints & Grievances
      </h2>
      <p className="text-sm opacity-70 mb-8">Submit your concerns or report issues. Your identity can be kept anonymous if requested.</p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase opacity-60">Subject</label>
          <input
            type="text"
            placeholder="Briefly describe the issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`w-full p-2 rounded border text-sm focus:outline-none focus:border-red-500 transition-colors ${
              errors.subject ? 'border-red-500' : isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'
            }`}
          />
          {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase opacity-60">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full p-2 rounded border text-sm focus:outline-none focus:border-red-500 transition-colors ${
              isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'
            }`}
          >
            <option value="academic">Academic Issue</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="placement">Placement Cell</option>
            <option value="harassment">Harassment/Reporting</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase opacity-60">Description</label>
          <textarea
            rows={6}
            placeholder="Provide details about your grievance..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full p-2 rounded border text-sm focus:outline-none focus:border-red-500 transition-colors ${
              errors.description ? 'border-red-500' : isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'
            }`}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="anon"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 accent-red-500"
          />
          <label htmlFor="anon" className="text-sm cursor-pointer">
            Submit Anonymously
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-50 transition-all"
        >
          {loading ? 'Submitting...' : 'Submit Grievance'}
        </button>
      </form>
    </div>
  );
}