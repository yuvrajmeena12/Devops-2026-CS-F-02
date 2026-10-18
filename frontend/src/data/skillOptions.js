// Curated skill suggestions per category, aligned with the 15 SkillSwap official categories.
// Keeping spelling and casing consistent powers the deterministic matching algorithm.

const skillOptions = {
  Programming: [
    'JavaScript', 'Python', 'Java', 'C++', 'C', 'TypeScript', 'SQL', 'MongoDB',
    'Git & GitHub', 'Android Development', 'iOS Development', 'Flutter', 'Docker',
    'Go', 'Rust', 'Linux & Bash', 'Data Structures & Algorithms',
  ],
  'Web Development': [
    'React', 'Node.js', 'HTML & CSS', 'Next.js', 'Vue.js', 'TailwindCSS',
    'Express.js', 'Full Stack Development', 'WordPress', 'GraphQL', 'REST APIs',
  ],
  'Data & AI': [
    'Machine Learning', 'Deep Learning', 'Data Analysis', 'Power BI', 'Excel & Spreadsheets',
    'Python for Data Science', 'TensorFlow', 'PyTorch', 'Data Visualization', 'BigQuery',
  ],
  Design: [
    'UI/UX Design', 'Figma', 'Graphic Design', 'Sketching / Drawing', 'Painting',
    'Digital Illustration', 'Animation', 'Typography', 'Logo Design', 'Adobe Photoshop',
  ],
  'Video & Photography': [
    'Photography', 'Video Editing', 'Premiere Pro', 'After Effects', 'DaVinci Resolve',
    'Cinematography', 'YouTube Production', 'Lighting & Color Grading',
  ],
  Music: [
    'Guitar', 'Piano', 'Vocals / Singing', 'Drums', 'Violin', 'Ukulele',
    'Music Production', 'Tabla', 'Flute', 'Music Theory', 'DJing', 'Songwriting',
    'Harmonium', 'Beatboxing',
  ],
  Languages: [
    'English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese',
    'Mandarin Chinese', 'Korean', 'Sign Language', 'Sanskrit', 'Arabic', 'Italian',
    'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Russian', 'Portuguese',
  ],
  Business: [
    'Entrepreneurship', 'Project Management', 'Product Management', 'Startup Strategy',
    'Financial Modeling', 'Sales & Negotiation', 'Accounting', 'Business Analytics',
  ],
  Marketing: [
    'Digital Marketing', 'SEO', 'Social Media Marketing', 'Content Marketing',
    'Google Ads', 'Copywriting', 'Email Marketing', 'Brand Strategy',
  ],
  Writing: [
    'Creative Writing', 'Essay Writing', 'Technical Writing', 'Copywriting',
    'Storytelling', 'Blogging', 'Screenwriting', 'Research Papers',
  ],
  'Science & Math': [
    'Mathematics', 'Calculus', 'Linear Algebra', 'Physics', 'Chemistry',
    'Biology', 'Statistics', 'Research Methods',
  ],
  Cooking: [
    'Baking', 'Indian Cuisine', 'Italian Cuisine', 'Vegan Cooking',
    'Cake Decorating', 'Bartending / Mocktails', 'Street Food', 'Grilling & BBQ',
    'Chinese Cuisine', 'Meal Prepping',
  ],
  'Fitness & Wellness': [
    'Yoga', 'Weightlifting / Strength Training', 'Running', 'Cricket Coaching',
    'Football / Soccer', 'Badminton', 'Swimming', 'Martial Arts', 'Pilates',
    'Cycling', 'Dance (Bollywood / Hip-Hop)', 'Meditation', 'Boxing',
  ],
  'Public Speaking': [
    'Public Speaking', 'Toastmasters / Speech', 'Presentation Skills', 'Debate',
    'Pitching & Demo Day', 'Voice Modulation', 'Interview Preparation',
  ],
  Other: [
    'Chess', 'Life Coaching', 'Productivity & Habits', 'Personal Finance',
  ],

  // Backward compatibility aliases
  Tech: [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'HTML & CSS',
    'TypeScript', 'SQL', 'MongoDB', 'Git & GitHub', 'Machine Learning',
  ],
  Language: [
    'English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese',
    'Mandarin Chinese', 'Korean',
  ],
  Fitness: [
    'Yoga', 'Weightlifting / Strength Training', 'Running', 'Football / Soccer',
    'Badminton', 'Swimming', 'Pilates', 'Meditation',
  ],
  Art: [
    'Sketching / Drawing', 'Painting', 'Graphic Design', 'Photography',
    'Digital Illustration', 'Animation',
  ],
  Academic: [
    'Mathematics', 'Physics', 'Chemistry', 'Public Speaking', 'Essay Writing',
    'Statistics',
  ],
};

export default skillOptions;
