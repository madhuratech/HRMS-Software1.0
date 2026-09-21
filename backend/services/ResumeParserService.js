const fs = require('fs');
const path = require('path');
let pdfLib = null;
try {
  pdfLib = require('pdf-parse');
} catch (e) {
  try {
    pdfLib = require('../node_modules/pdf-parse');
  } catch (err) {
    console.warn('[ResumeParserService] pdf-parse module could not be loaded directly:', err.message);
  }
}

/**
 * Standard Skill Dictionary & Normalization Mappings
 */
const SKILL_DICTIONARY = [
  // Programming & Scripting Languages
  { canonical: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'es7', 'vanilla js'] },
  { canonical: 'TypeScript', aliases: ['typescript', 'ts'] },
  { canonical: 'Python', aliases: ['python', 'py', 'python3', 'django', 'flask', 'fastapi'] },
  { canonical: 'Java', aliases: ['java', 'core java', 'j2ee', 'spring', 'spring boot', 'hibernate'] },
  { canonical: 'C++', aliases: ['c++', 'cpp'] },
  { canonical: 'C#', aliases: ['c#', 'csharp', '.net', 'dotnet', 'asp.net'] },
  { canonical: 'PHP', aliases: ['php', 'laravel', 'codeigniter', 'symfony', 'wordpress'] },
  { canonical: 'Ruby', aliases: ['ruby', 'ruby on rails', 'rails'] },
  { canonical: 'Go', aliases: ['golang', 'go lang'] },
  { canonical: 'Rust', aliases: ['rust'] },
  { canonical: 'Kotlin', aliases: ['kotlin'] },
  { canonical: 'Swift', aliases: ['swift', 'ios development', 'swiftui', 'objective-c'] },
  { canonical: 'Dart', aliases: ['dart', 'flutter'] },
  { canonical: 'HTML/CSS', aliases: ['html', 'html5', 'css', 'css3', 'sass', 'scss', 'less'] },
  { canonical: 'SQL', aliases: ['sql', 'plsql', 't-sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle'] },

  // Frontend Frameworks & Libraries
  { canonical: 'React', aliases: ['react', 'react.js', 'reactjs', 'redux', 'next.js', 'nextjs'] },
  { canonical: 'Angular', aliases: ['angular', 'angularjs', 'angular.js', 'ngrx'] },
  { canonical: 'Vue', aliases: ['vue', 'vue.js', 'vuejs', 'vuex', 'nuxt', 'nuxtjs'] },
  { canonical: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss', 'tailwind css'] },
  { canonical: 'Bootstrap', aliases: ['bootstrap', 'bootstrap 5', 'bootstrap 4'] },
  { canonical: 'jQuery', aliases: ['jquery'] },
  { canonical: 'Svelte', aliases: ['svelte', 'sveltekit'] },

  // Backend & Runtime
  { canonical: 'Node.js', aliases: ['node', 'node.js', 'nodejs', 'express', 'express.js', 'expressjs', 'nestjs', 'koa'] },
  { canonical: 'Django', aliases: ['django', 'django rest framework', 'drf'] },
  { canonical: 'Spring Boot', aliases: ['spring boot', 'springboot', 'spring framework'] },
  { canonical: 'GraphQL', aliases: ['graphql', 'apollo'] },
  { canonical: 'REST APIs', aliases: ['rest', 'rest api', 'rest apis', 'restful', 'restful apis', 'api integration', 'microservices'] },

  // Mobile App Development
  { canonical: 'Flutter', aliases: ['flutter', 'flutter sdk', 'cross-platform mobile'] },
  { canonical: 'React Native', aliases: ['react native', 'react-native'] },
  { canonical: 'Android', aliases: ['android', 'android studio', 'android sdk'] },
  { canonical: 'iOS', aliases: ['ios', 'xcode', 'cocoapods'] },

  // Databases & Caching
  { canonical: 'MongoDB', aliases: ['mongodb', 'mongo', 'mongoose', 'nosql'] },
  { canonical: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'psql'] },
  { canonical: 'MySQL', aliases: ['mysql', 'mariadb'] },
  { canonical: 'Redis', aliases: ['redis', 'memcached'] },
  { canonical: 'Elasticsearch', aliases: ['elasticsearch', 'elastic search', 'elk'] },
  { canonical: 'Firebase', aliases: ['firebase', 'firestore', 'firebase auth'] },

  // Cloud & DevOps
  { canonical: 'AWS', aliases: ['aws', 'amazon web services', 's3', 'ec2', 'lambda', 'cloudfront', 'rds'] },
  { canonical: 'Azure', aliases: ['azure', 'microsoft azure'] },
  { canonical: 'GCP', aliases: ['gcp', 'google cloud', 'google cloud platform'] },
  { canonical: 'Docker', aliases: ['docker', 'containerization', 'docker compose', 'dockerfile'] },
  { canonical: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  { canonical: 'CI/CD', aliases: ['ci/cd', 'cicd', 'jenkins', 'github actions', 'gitlab ci'] },
  { canonical: 'Git', aliases: ['git', 'github', 'gitlab', 'bitbucket', 'version control'] },
  { canonical: 'Linux', aliases: ['linux', 'ubuntu', 'centos', 'bash', 'shell scripting'] },

  // Testing & Quality Assurance
  { canonical: 'Selenium', aliases: ['selenium', 'sellinium', 'selenium webdriver', 'webdriver'] },
  { canonical: 'Automation Testing', aliases: ['automation testing', 'test automation', 'qa automation'] },
  { canonical: 'Manual Testing', aliases: ['manual testing', 'qa testing', 'software testing', 'black box testing', 'regression testing'] },
  { canonical: 'Jest', aliases: ['jest', 'mocha', 'chai', 'jasmine'] },
  { canonical: 'Cypress', aliases: ['cypress', 'playwright'] },
  { canonical: 'Postman', aliases: ['postman', 'api testing', 'swagger'] },
  { canonical: 'JUnit', aliases: ['junit', 'testng', 'pytest', 'unittest'] },
  { canonical: 'Performance Testing', aliases: ['jmeter', 'performance testing', 'load testing'] },

  // Project & Methodologies
  { canonical: 'Agile', aliases: ['agile', 'scrum', 'kanban', 'sprints', 'jira'] },
  { canonical: 'UI/UX Design', aliases: ['ui/ux', 'ui design', 'ux design', 'figma', 'adobe xd', 'wireframing'] },
  { canonical: 'Machine Learning', aliases: ['machine learning', 'ml', 'deep learning', 'nlp', 'tensorflow', 'pytorch', 'scikit-learn', 'data science', 'artificial intelligence', 'ai'] }
];

// Degree mappings for education extraction
const DEGREE_PATTERNS = [
  { degree: 'Ph.D / Doctorate', regex: /\b(ph\.?d|doctorate|doctor of philosophy)\b/i },
  { degree: 'Master of Technology (M.Tech / ME)', regex: /\b(m\.?tech|m\.?e\.?|master of technology|master of engineering)\b/i },
  { degree: 'Master of Computer Applications (MCA)', regex: /\b(mca|master of computer applications?)\b/i },
  { degree: 'Master of Science (M.Sc / MS)', regex: /\b(m\.?sc|m\.?s\.?|master of science)\b/i },
  { degree: 'MBA', regex: /\b(mba|master of business administration)\b/i },
  { degree: 'Bachelor of Technology (B.Tech / BE)', regex: /\b(b\.?tech|b\.?e\.?|bachelor of technology|bachelor of engineering)\b/i },
  { degree: 'Bachelor of Computer Applications (BCA)', regex: /\b(bca|bachelor of computer applications?)\b/i },
  { degree: 'Bachelor of Science (B.Sc / BS)', regex: /\b(b\.?sc|b\.?s\.?|bachelor of science)\b/i },
  { degree: 'Bachelor of Commerce (B.Com)', regex: /\b(b\.?com|bachelor of commerce)\b/i },
  { degree: 'Bachelor Degree / Graduate', regex: /\b(bachelor|graduate|undergraduate|degree)\b/i },
  { degree: 'Diploma', regex: /\b(diploma|polytechnic)\b/i }
];

class ResumeParserService {
  /**
   * Resolves absolute file path from database resume URL or filename
   */
  static resolveFilePath(resumeUrlOrPath, candidateName = null, originalResumeName = null) {
    if (!resumeUrlOrPath && !originalResumeName) return null;
    let cleanPath = (resumeUrlOrPath || '').replace(/^[/\\]+/, '');
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.substring('uploads/'.length);
    }
    
    // Check multiple candidate locations
    const possiblePaths = [
      path.join(__dirname, '../uploads', cleanPath),
      path.join(__dirname, '../uploads', path.basename(cleanPath)),
      path.join(__dirname, '../uploads/documents', path.basename(cleanPath)),
      path.join(__dirname, '../uploads/documents/employee', path.basename(cleanPath)),
      originalResumeName ? path.join(__dirname, '../uploads', path.basename(originalResumeName)) : null,
      path.resolve(cleanPath),
      cleanPath ? path.join('C:/Users/Hp/Downloads', path.basename(cleanPath)) : null,
      originalResumeName ? path.join('C:/Users/Hp/Downloads', path.basename(originalResumeName)) : null
    ].filter(Boolean);

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        // Auto-copy to backend/uploads if found in external folder like Downloads
        const targetUploadPath = path.join(__dirname, '../uploads', path.basename(cleanPath || originalResumeName));
        if (!fs.existsSync(targetUploadPath) && p !== targetUploadPath) {
          try {
            fs.copyFileSync(p, targetUploadPath);
          } catch(e){}
        }
        return p;
      }
    }

    // Candidate name matching in Downloads and uploads if filename was randomized
    if (candidateName) {
      const firstName = candidateName.toLowerCase().trim().split(' ')[0];
      if (firstName.length >= 3) {
        const searchDirs = [path.join(__dirname, '../uploads'), 'C:/Users/Hp/Downloads'];
        for (const dir of searchDirs) {
          try {
            if (fs.existsSync(dir)) {
              const files = fs.readdirSync(dir);
              for (const f of files) {
                if (f.toLowerCase().endsWith('.pdf') && f.toLowerCase().includes(firstName)) {
                  const matchedPath = path.join(dir, f);
                  const targetUploadPath = path.join(__dirname, '../uploads', path.basename(cleanPath || f));
                  if (!fs.existsSync(targetUploadPath) && matchedPath !== targetUploadPath) {
                    try {
                      fs.copyFileSync(matchedPath, targetUploadPath);
                    } catch(e){}
                  }
                  return matchedPath;
                }
              }
            }
          } catch(e){}
        }
      }
    }

    return null;
  }

  /**
   * Extract raw text from resume file (PDF, TXT, DOCX)
   */
  static async extractRawText(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return '';
    }

    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        if (pdfLib) {
          if (typeof pdfLib === 'function') {
            const parsed = await pdfLib(dataBuffer);
            if (parsed && parsed.text) return parsed.text;
          } else if (pdfLib.PDFParse) {
            const parser = new pdfLib.PDFParse({ data: dataBuffer });
            const parsed = await parser.getText();
            if (typeof parsed === 'string') return parsed;
            if (parsed && parsed.text) return parsed.text;
          }
        }
      } catch (err) {
        console.warn(`[ResumeParserService] pdf parser notice on ${filePath}:`, err.message);
      }

      // Fallback: Read raw buffer and extract ascii strings
      try {
        const buffer = fs.readFileSync(filePath);
        const raw = buffer.toString('latin1');
        return raw.replace(/[^a-zA-Z0-9\s.,;/@()#+-]/g, ' ');
      } catch (e) {
        return '';
      }
    }

    if (ext === '.txt' || ext === '.json' || ext === '.csv' || ext === '.rtf') {
      try {
        return fs.readFileSync(filePath, 'utf8');
      } catch (err) {
        return '';
      }
    }

    if (ext === '.doc' || ext === '.docx') {
      try {
        const buffer = fs.readFileSync(filePath);
        return buffer.toString('utf8').replace(/[^a-zA-Z0-9\s.,;/@()#+-]/g, ' ');
      } catch (err) {
        return '';
      }
    }

    return '';
  }

  /**
   * Extract matching canonical skills from text
   */
  static extractSkillsFromText(text) {
    if (!text || typeof text !== 'string') return [];
    const lowerText = text.toLowerCase();
    const extractedSkills = new Set();

    SKILL_DICTIONARY.forEach(({ canonical, aliases }) => {
      for (const alias of aliases) {
        // Use regex for clean boundary match
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
        if (pattern.test(lowerText) || lowerText.includes(` ${alias.toLowerCase()} `)) {
          extractedSkills.add(canonical);
          break;
        }
      }
    });

    return Array.from(extractedSkills);
  }

  /**
   * Extract education degree from text
   */
  static extractEducationFromText(text) {
    if (!text) return null;
    for (const { degree, regex } of DEGREE_PATTERNS) {
      if (regex.test(text)) {
        return degree;
      }
    }
    return null;
  }

  /**
   * Extract total years of experience from text
   */
  static extractExperienceFromText(text) {
    if (!text) return null;
    const patterns = [
      /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i,
      /experience\s*:\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i,
      /total\s+experience\s*:\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s+in\s+software/i
    ];

    for (const p of patterns) {
      const match = text.match(p);
      if (match) {
        return `${parseFloat(match[1])} Years`;
      }
    }

    return null;
  }

  /**
   * Full Parser: Parses resume file and returns complete metadata
   */
  static async parseResume(resumeUrlOrPath) {
    const resolvedPath = this.resolveFilePath(resumeUrlOrPath);
    if (!resolvedPath) {
      return {
        success: false,
        message: 'Resume file not found on server disk',
        skills: [],
        education: null,
        experience: null,
        rawText: ''
      };
    }

    try {
      const rawText = await this.extractRawText(resolvedPath);
      const skills = this.extractSkillsFromText(rawText);
      const education = this.extractEducationFromText(rawText);
      const experience = this.extractExperienceFromText(rawText);

      return {
        success: true,
        filePath: resolvedPath,
        skills,
        education,
        experience,
        rawText: rawText.substring(0, 3000)
      };
    } catch (err) {
      console.error('[ResumeParserService] Parse error:', err);
      return {
        success: false,
        message: err.message,
        skills: [],
        education: null,
        experience: null,
        rawText: ''
      };
    }
  }

  /**
   * Merge Candidate Skills following Priority:
   * Priority 1: Extracted from Resume
   * Priority 2: Entered in Application Form
   * Priority 3: Candidate Profile / Existing DB
   */
  static mergeSkills({ resumeSkills = [], formSkills = '', profileSkills = '' }) {
    const allSkills = new Set();

    // 1. Resume skills (Priority 1)
    if (Array.isArray(resumeSkills)) {
      resumeSkills.forEach(s => {
        if (s && String(s).trim()) allSkills.add(String(s).trim());
      });
    }

    // 2. Form skills (Priority 2)
    if (formSkills) {
      const splitted = String(formSkills).split(/[,;|\n/]+/);
      splitted.forEach(s => {
        const clean = s.trim();
        if (clean.length > 1) {
          const canonicalMatch = SKILL_DICTIONARY.find(item => 
            item.aliases.some(a => a.toLowerCase() === clean.toLowerCase())
          );
          allSkills.add(canonicalMatch ? canonicalMatch.canonical : clean);
        }
      });
    }

    // 3. Profile skills (Priority 3)
    if (profileSkills) {
      const splitted = String(profileSkills).split(/[,;|\n/]+/);
      splitted.forEach(s => {
        const clean = s.trim();
        if (clean.length > 1) {
          const canonicalMatch = SKILL_DICTIONARY.find(item => 
            item.aliases.some(a => a.toLowerCase() === clean.toLowerCase())
          );
          allSkills.add(canonicalMatch ? canonicalMatch.canonical : clean);
        }
      });
    }

    return Array.from(allSkills);
  }
}

module.exports = ResumeParserService;
