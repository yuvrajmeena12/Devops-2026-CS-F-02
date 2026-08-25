// Curated skill suggestions per category, used to power the searchable
// skill dropdown. Keeping everyone's spelling/casing consistent here is
// what makes the matching algorithm actually find people reliably —
// "React", "react.js", and "ReactJS" would never match each other as
// free text, but they will if everyone picks the same option from this list.
//
// Users can still type something not on this list and add it as a custom
// skill (see the "Add [x] as a new skill" option in SkillAutocomplete) —
// this list is suggestions, not a restriction.

const skillOptions = {
  Tech: [
    'JavaScript', 'Python', 'Java', 'C++', 'C', 'React', 'Node.js', 'HTML & CSS',
    'TypeScript', 'SQL', 'MongoDB', 'Git & GitHub', 'Machine Learning',
    'Data Structures & Algorithms', 'Android Development', 'iOS Development',
    'Cloud Computing (AWS)', 'Cybersecurity Basics', 'UI/UX Design', 'WordPress',
    'Excel & Spreadsheets', 'PHP', 'Flutter', 'Docker', 'Data Analysis', 'Power BI',
  ],
  Music: [
    'Guitar', 'Piano', 'Vocals / Singing', 'Drums', 'Violin', 'Ukulele',
    'Music Production', 'Tabla', 'Flute', 'Music Theory', 'DJing', 'Songwriting',
    'Harmonium', 'Beatboxing',
  ],
  Language: [
    'English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese',
    'Mandarin Chinese', 'Korean', 'Sign Language', 'Sanskrit', 'Arabic', 'Italian',
    'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Russian', 'Portuguese',
  ],
  Fitness: [
    'Yoga', 'Weightlifting / Strength Training', 'Running', 'Cricket Coaching',
    'Football / Soccer', 'Badminton', 'Swimming', 'Martial Arts', 'Pilates',
    'Cycling', 'Dance (Bollywood / Hip-Hop)', 'Meditation', 'Basketball',
    'Table Tennis', 'Boxing',
  ],
  Art: [
    'Sketching / Drawing', 'Painting', 'Calligraphy', 'Photography',
    'Graphic Design', 'Pottery', 'Digital Illustration', 'Sculpture', 'Origami',
    'Henna / Mehendi Art', 'Video Editing', 'Animation',
  ],
  Cooking: [
    'Baking', 'Indian Cuisine', 'Italian Cuisine', 'Vegan Cooking',
    'Cake Decorating', 'Bartending / Mocktails', 'Street Food', 'Grilling & BBQ',
    'Chinese Cuisine', 'Meal Prepping',
  ],
  Academic: [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Public Speaking',
    'Essay Writing', 'Resume Building', 'Interview Preparation',
    'Competitive Exam Coaching', 'History', 'Economics', 'Accounting',
    'Statistics', 'Research Methods',
  ],
  Other: [],
};

export default skillOptions;
