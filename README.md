# Interview Intelligence Engine

An AI-powered web platform designed to help job seekers improve their interview skills through real-time voice analysis, role-specific feedback, and performance reporting.

---

## 💡 Features

### 🎤 Audio Input

* Record live interview answers via your microphone
* Or upload existing audio files for evaluation

### 🔊 Transcription (OpenAI Whisper)

* Converts spoken answers into editable text
* Users can refine transcripts before analysis

### 🧠 Role-Aware AI Feedback (OpenAI GPT-3.5)

* Choose from roles like Software Engineer, PM, or Data Analyst
* Feedback adapts to role-specific expectations

### 📊 Interview Metrics

* Words per minute (WPM)
* Filler words (e.g., "uh", "like")
* Confidence, structure, and clarity scores

### 📥 Downloadable Coaching Report

* Branded, timestamped PDF with all insights
* Great for sharing with mentors or tracking improvement

### 🧼 Reset & Reattempt

* Easily clear and redo sessions

### 🧾 Privacy First

* No data stored; processing is temporary

### 🪄 Onboarding Guide

* Friendly walkthrough for first-time users

---

## 🔧 Built With

* **Frontend**: React, TypeScript, TailwindCSS, Vite
* **Backend**: Node.js, Express, OpenAI APIs
* **Audio**: RecordRTC
* **NLP**: OpenAI Whisper + GPT-3.5
* **Visualization**: Recharts
* **Exporting**: jsPDF, html2canvas
