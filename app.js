// Resume Analyzer App Logic
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

  // Global Session
  let currentCompany = "";
  let currentRecruiter = "";

  // Core UI Elements
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const loadingOverlay = document.getElementById("loading-overlay");
  
  // Views
  const viewRecruiterLogin = document.getElementById("view-recruiter-login");
  const viewHub = document.getElementById("view-hub");
  const viewCandidateLogin = document.getElementById("view-candidate-login");
  const viewUpload = document.getElementById("view-upload");
  const viewDashboard = document.getElementById("view-dashboard");
  const viewAssessment = document.getElementById("view-assessment");
  const viewResults = document.getElementById("view-results");
  const viewAdmin = document.getElementById("view-admin");
  
  // Modals Setup
  const levelModal = document.getElementById("level-modal");
  
  // Buttons
  const btnStartTest = document.getElementById("btn-start-test");
  const btnAdminHome = document.getElementById("btn-admin-home");
  const btnClearDb = document.getElementById("btn-clear-db");
  const appStatus = document.getElementById("app-status");
  
  // Camera Elements
  const camWarning = document.getElementById("cam-warning");
  const faceStatusDot = document.getElementById("face-status-dot");
  // Recruiter Login Hook
  document.getElementById("btn-rec-login")?.addEventListener("click", () => {
     const c = document.getElementById("rec-company").value.trim();
     const n = document.getElementById("rec-name").value.trim() || "Admin";
     if(!c) return alert("Company Name is strictly required.");
     currentCompany = c;
     currentRecruiter = n;
     if(document.getElementById("hub-company-name")) document.getElementById("hub-company-name").textContent = currentCompany;
     switchView(viewHub);
  });
  
  document.getElementById("btn-hub-admin")?.addEventListener("click", () => {
    switchView(viewAdmin);
    loadAdminDatabase();
  });
  
  document.getElementById("btn-hub-kiosk")?.addEventListener("click", () => {
    document.getElementById("cand-company").value = currentCompany;
    switchView(viewCandidateLogin);
  });

  // Candidate Login Hook
  document.getElementById("btn-cand-login")?.addEventListener("click", () => {
     const c = document.getElementById("cand-company").value.trim();
     const n = document.getElementById("cand-name").value.trim();
     const e = document.getElementById("cand-email").value.trim();
     const r = document.getElementById("cand-role").value.trim();
     if(!c || !n || !e || !r) return alert("All fields are required!");
     
     currentCompany = c;
     candidateData = { name: n, email: e, role: r };
     
     switchView(viewUpload);
  });

  // Application State
  let tabSwitchWarnings = 0;
  let chartInstance = null;
  let extractedSkills = [];
  let generatedQuestions = [];
  let userAnswers = []; 
  let currentQuestionIndex = 0;
  let correctAnswers = 0;
  let timeRemaining = 600; 
  let timerInterval = null;
  let proctoringInterval = null;
  let selectedOptionIndex = null;
  let userLevel = 'beginner';
  
  let candidateData = {
    name: "",
    email: "",
    role: ""
  };
  
  // Massive Dynamic Question Pool
  const QUESTION_BANK = {
    'javascript': [
      { q: "Which keyword is used to declare a block-scoped variable?", options: ["var", "let", "function", "def"], a: 1 },
      { q: "What does 'typeof []' return in JavaScript?", options: ["array", "list", "object", "undefined"], a: 2 },
      { q: "Which method adds an element to the end of an array?", options: [".push()", ".pop()", ".shift()", ".append()"], a: 0 },
      { q: "What is the purpose of Promise.all()?", options: ["Runs one promise", "Runs multiple promises in parallel", "Cancels promises", "Makes promises synchronous"], a: 1 },
      { q: "In JavaScript, what is a closure?", options: ["A locked object", "A UI component", "A function remembering its lexical scope", "A CSS technique"], a: 2 },
      { q: "How do you correctly check if an object is an Array?", options: ["typeof obj === 'array'", "Array.isArray(obj)", "obj.isArray()", "obj instanceof Array"], a: 1 },
      { q: "What does the 'this' keyword refer to inside an arrow function?", options: ["The global object", "The function itself", "The lexically enclosing scope", "Undefined"], a: 2 },
      { q: "Which statement will prevent default form submission?", options: ["event.preventDefault()", "event.stopPropagation()", "event.halt()", "event.stop()"], a: 0 },
      { q: "What is the output of '2' + 2 in JavaScript?", options: ["4", "22", "NaN", "Error"], a: 1 },
      { q: "Which feature allows extracting properties from objects into distinct variables?", options: ["Spreading", "Rest parameters", "Destructuring", "Mapping"], a: 2 }
    ],
    'python': [
      { q: "How do you create a function in Python?", options: ["function my_func():", "def my_func():", "create my_func():", "func my_func():"], a: 1 },
      { q: "Which of these is a mutable data type?", options: ["Tuple", "String", "List", "Integer"], a: 2 },
      { q: "What does the 'self' keyword represent in a class?", options: ["The parent class", "The current instance of the class", "A global variable", "A private method"], a: 1 },
      { q: "How do you insert an element at a specific index in a list?", options: ["list.insert(index, element)", "list.add(element, index)", "list.push(index)", "list.append(index, element)"], a: 0 },
      { q: "What is a Python dictionary?", options: ["An ordered list", "A sequence of numbers", "A collection of Key-Value pairs", "A text file"], a: 2 },
      { q: "How do you start a single line comment in Python?", options: ["//", "/*", "<!--", "#"], a: 3 },
      { q: "What is the result of 3 ** 2 in Python?", options: ["6", "9", "32", "None"], a: 1 },
      { q: "Which method removes whitespace from the beginning and end of a string?", options: ["strip()", "trim()", "ptrim()", "clean()"], a: 0 },
      { q: "How do you handle exceptions in Python?", options: ["try/catch", "try/except", "do/catch", "throw/catch"], a: 1 },
      { q: "What does 'len()' do?", options: ["Finds the length of an object", "Lists enumerations", "Converts back to string", "Locks an object"], a: 0 }
    ],
    'java': [
      { q: "Which data type is used to create a variable that should store text?", options: ["String", "txt", "string", "Char"], a: 0 },
      { q: "What is the size of an int variable in Java?", options: ["8 bit", "16 bit", "32 bit", "64 bit"], a: 2 },
      { q: "Which keyword is used to inherit a class?", options: ["implement", "extend", "inherit", "extends"], a: 3 },
      { q: "What does JVM stand for?", options: ["Java Virtual Machine", "Java Void Main", "Java Verified Memory", "Java Variable Method"], a: 0 },
      { q: "Which collection allows unique elements only?", options: ["List", "Queue", "Set", "Map"], a: 2 },
      { q: "What is the entry point of a Java program?", options: ["start()", "init()", "main()", "run()"], a: 2 },
      { q: "Which keyword is used to stop a loop?", options: ["stop", "exit", "break", "return"], a: 2 },
      { q: "Which of the following creates a new Java object?", options: ["The new keyword", "The object keyword", "The create keyword", "The class keyword"], a: 0 },
      { q: "What is polymorphism?", options: ["Data hiding", "Code isolation", "Many forms", "Memory leaks"], a: 2 },
      { q: "How do you define an interface conceptually in Java?", options: ["As a completely abstract class", "As a private inner object", "As a variable", "As a final class"], a: 0 }
    ],
    'html': [
      { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "Hyperlinks and Text Markup Language", "Home Tool Markup Language", "Hyper Text Machine Language"], a: 0 },
      { q: "Choose the correct HTML element for the largest heading:", options: ["<heading>", "<h1>", "<h6>", "<head>"], a: 1 },
      { q: "What is the correct HTML element for inserting a line break?", options: ["<br>", "<lb>", "<break>", "<tr>"], a: 0 },
      { q: "Which character is used to indicate an end tag?", options: ["^", "<", "*", "/"], a: 3 },
      { q: "Which HTML attribute specifies an alternate text for an image?", options: ["alt", "title", "src", "longdesc"], a: 0 },
      { q: "How can you make a numbered list?", options: ["<ul>", "<dl>", "<ol>", "<list>"], a: 2 },
      { q: "What is the correct HTML for making a checkbox?", options: ["<check>", "<input type='checkbox'>", "<checkbox>", "<input type='check'>"], a: 1 },
      { q: "Which input type defines a slider control?", options: ["slider", "range", "search", "controls"], a: 1 },
      { q: "Which element wraps the metadata of a document?", options: ["<body>", "<meta>", "<head>", "<header>"], a: 2 },
      { q: "What is the `<canvas>` element used for?", options: ["Displaying images exactly", "Drawing graphics via JS", "Creating databases", "Storing CSS shapes"], a: 1 }
    ],
    'css': [
      { q: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"], a: 0 },
      { q: "How do you select an element with id 'demo'?", options: [".demo", "#demo", "*demo", "demo"], a: 1 },
      { q: "Which property is used to change the background color?", options: ["bgcolor", "color", "background-color", "bg-color"], a: 2 },
      { q: "How do you make the text bold?", options: ["font-weight: bold;", "style: bold;", "font: bold;", "text-weight: bold;"], a: 0 },
      { q: "Which CSS property controls the text size?", options: ["font-size", "text-style", "font-style", "text-size"], a: 0 },
      { q: "How do you display a border like this: The top border = 10px, bottom border = 5px, left border = 20px, right border = 1px?", options: ["border-width: 10px 1px 5px 20px;", "border-width: 10px 20px 5px 1px;", "border-width: 5px 20px 10px 1px;", "border-width: 10px 5px 20px 1px;"], a: 0 },
      { q: "What is the default value of the position property?", options: ["relative", "fixed", "absolute", "static"], a: 3 },
      { q: "How do you make a list that lists its items with squares?", options: ["list-type: square;", "list-style-type: square;", "list: square;", "bullet: square;"], a: 1 },
      { q: "Which property is used to change the font of an element?", options: ["font-family", "font-style", "font-weight", "font-variant"], a: 0 },
      { q: "Which value is NOT a valid representation of a color?", options: ["#ff0000", "rgb(255, 0, 0)", "hsl(0, 100%, 50%)", "color: hard-red"], a: 3 }
    ],
    'react': [
      { q: "What is used to pass data to a component from outside?", options: ["setState", "Render with arguments", "Props", "PropTypes"], a: 2 },
      { q: "Which hook is used to perform side effects?", options: ["useState", "useEffect", "useMemo", "useContext"], a: 1 },
      { q: "What does a React component return?", options: ["HTML Strings", "JSX elements", "CSS Styles", "Machine code"], a: 1 },
      { q: "How can you prevent a component from re-rendering?", options: ["React.memo", "React.stop", "useState", "useEffect"], a: 0 },
      { q: "What is the virtual DOM?", options: ["A direct copy of the HTML", "A lightweight JavaScript representation of the DOM", "A CSS library", "A server-side tool"], a: 1 },
      { q: "How do you update the state of a component using useState?", options: ["By modifying the variable directly", "By using the provided setter function", "By using setState()", "By calling render()"], a: 1 },
      { q: "What rule applies to React Hooks?", options: ["Call them anywhere", "Call them inside loops", "Call them only at the top level", "Call them inside regular JS functions"], a: 2 },
      { q: "Which hook lets you reference a value that’s not needed for rendering?", options: ["useRef", "useState", "useMemo", "useCallback"], a: 0 },
      { q: "What is JSX?", options: ["A JS templating language", "A syntax extension for Javascript", "A backend framework", "An HTML compiler"], a: 1 },
      { q: "How do you wrap multiple elements when returning from a component without adding a DOM node?", options: ["<div>", "<React.Fragment>", "<span>", "<Node>"], a: 1 }
    ],
    'sql': [
      { q: "Which statement is used to extract data from a database?", options: ["GET", "OPEN", "EXTRACT", "SELECT"], a: 3 },
      { q: "Which statement is used to update data in a database?", options: ["SAVE", "MODIFY", "UPDATE", "SAVE AS"], a: 2 },
      { q: "What does SQL stand for?", options: ["Structured Question Language", "Strong Question Language", "Structured Query Language", "Standard Query Logic"], a: 2 },
      { q: "Which clause is used to filter records?", options: ["WHERE", "FILTER", "SORT", "MATCH"], a: 0 },
      { q: "Which JOIN returns all rows from both tables?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"], a: 3 },
      { q: "How do you select all columns from a table named 'Persons'?", options: ["SELECT * FROM Persons", "SELECT Persons", "SELECT [all] FROM Persons", "EXTRACT Persons"], a: 0 },
      { q: "With SQL, how do you select all records from 'Persons' where 'FirstName' is 'Peter'?", options: ["SELECT * FROM Persons WHERE FirstName<>'Peter'", "SELECT * FROM Persons WHERE FirstName='Peter'", "SELECT [all] FROM Persons WHERE FirstName LIKE 'Peter'", "SELECT FirstName FROM Persons"], a: 1 },
      { q: "How do you sort results in descending order?", options: ["ORDER BY column DESC", "SORT column DESC", "ORDER column DOWN", "DESC column"], a: 0 },
      { q: "Which keyword is used to return only distinct values?", options: ["UNIQUE", "DIFFERENT", "DISTINCT", "NOSAME"], a: 2 },
      { q: "Which operator is used to search for a specified pattern in a column?", options: ["GET", "LIKE", "MATCH", "SEEK"], a: 1 }
    ],
    'node': [
      { q: "Node.js allows you to execute JavaScript where?", options: ["In the browser only", "On the server", "In a CSS file", "Only in an HTML file"], a: 1 },
      { q: "Which keyword is used to include an external module?", options: ["require", "import()", "include", "get"], a: 0 },
      { q: "Node.js is built on which JavaScript engine?", options: ["SpiderMonkey", "V8 Engine", "Chakra", "Rhino"], a: 1 },
      { q: "Which core module is used to create a web server?", options: ["fs", "url", "http", "path"], a: 2 },
      { q: "Is Node.js single-threaded or multi-threaded?", options: ["Single-threaded (Event Loop)", "Multi-threaded", "It has no threads", "Quad-threaded"], a: 0 },
      { q: "Which tool is commonly used to install Node.js packages?", options: ["npm", "pip", "gem", "apt"], a: 0 },
      { q: "What is package.json used for?", options: ["Storing HTML files", "Managing dependencies and scripts", "Running the compiler", "Compiling CSS"], a: 1 },
      { q: "What does the 'fs' module stand for?", options: ["File System", "Format System", "File Syntax", "Forward Status"], a: 0 },
      { q: "What is an event emitter in Node.js?", options: ["An object that emits named events", "A CSS animation", "A memory leak", "A database wrapper"], a: 0 },
      { q: "Which method is used to read a file synchronously?", options: ["fs.readFile()", "fs.readFileSync()", "fs.read()", "fs.receiveFileSync()"], a: 1 }
    ]
  };

  function getSkillQuestions(skill, level) {
    let qList = QUESTION_BANK[skill];
    if(!qList) return [];
    
    // Shuffle the pool of 10 questions randomly
    qList = [...qList].sort(() => 0.5 - Math.random());
    
    // Pick only 5 unique questions per test
    qList = qList.slice(0, 5);
    
    return qList.map((qObj) => ({
      skill: skill,
      q: `[${skill.toUpperCase()} | ${level.toUpperCase()}] ${qObj.q}`,
      options: qObj.options,
      a: qObj.a
    }));
  }

  // File Upload Logic
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", () => { dropZone.classList.remove("dragover"); });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault(); dropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });

  function switchView(viewElement) {
    if(viewRecruiterLogin) viewRecruiterLogin.classList.add("hidden");
    if(viewHub) viewHub.classList.add("hidden");
    if(viewCandidateLogin) viewCandidateLogin.classList.add("hidden");
    viewUpload.classList.add("hidden");
    viewDashboard.classList.add("hidden");
    viewAssessment.classList.add("hidden");
    viewResults.classList.add("hidden");
    viewAdmin.classList.add("hidden");
    levelModal.classList.add("hidden");
    viewElement.classList.remove("hidden");
  }

  btnStartTest.addEventListener("click", () => {
    levelModal.classList.remove("hidden");
  });

  async function handleFile(file) {
    if (file.type !== "application/pdf") return alert("Please upload a PDF file.");
    
    loadingOverlay.classList.remove("hidden");
    appStatus.textContent = "Extracting details...";
    appStatus.style.color = "#eab308";
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += " " + textContent.items.map(s => s.str).join(" ");
      }
      analyzeTextAndBuildDashboard(fullText.toLowerCase());

      loadingOverlay.classList.add("hidden");
      appStatus.textContent = "Extraction Success";
      appStatus.style.color = "#10b981";
      switchView(viewDashboard);
    } catch(err) {
      console.error(err);
      alert("Error parsing PDF! Ensure it contains readable text.");
      loadingOverlay.classList.add("hidden");
      appStatus.textContent = "Ready";
    }
  }

  function analyzeTextAndBuildDashboard(text) {
    const cleanText = text.replace(/https?:\/\/[^\s]+/g, '').replace(/www\.[^\s]+/g, '');
    const KNOWN_SKILLS = Object.keys(QUESTION_BANK);
    
    extractedSkills = KNOWN_SKILLS.filter(skill => {
      const regex = new RegExp("\\b" + skill + "\\b", "i");
      return regex.test(cleanText);
    }).slice(0, 4);
    
    if(extractedSkills.length === 0) extractedSkills = ['html', 'css']; // Safety fallback

    updateDashboardMetrics();
  }

  // --- Dynamic Dashboard Updates (Allows Manual Overrides) ---
  window.removeSkill = (skillToRemove) => {
    extractedSkills = extractedSkills.filter(s => s !== skillToRemove);
    if(extractedSkills.length === 0) {
      alert("Assessment requires at least 1 core skill to generate a valid test module. Defaulting to HTML.");
      extractedSkills = ['html'];
    }
    updateDashboardMetrics();
  };

  function updateDashboardMetrics() {
    // 1. Render Editable Chips
    const container = document.getElementById("editable-skills-container");
    container.innerHTML = '';
    extractedSkills.forEach(sk => {
      const chip = document.createElement("span");
      chip.className = "skill-chip";
      chip.innerHTML = `${sk.toUpperCase()} <i data-lucide="x" style="width:14px;"></i>`;
      chip.onclick = () => window.removeSkill(sk);
      container.appendChild(chip);
    });
    lucide.createIcons();

    // 2. Refresh Missing Skills Array Match
    const expected = ['javascript', 'react', 'node', 'sql'];
    const missing = expected.filter(sk => !extractedSkills.includes(sk));
    
    const mList = document.getElementById("missing-skills-list");
    mList.innerHTML = '';
    missing.forEach(m => { mList.innerHTML += `<li><i data-lucide="x-circle" style="color:#ef4444; width:16px;"></i> Expected: ${m.toUpperCase()}</li>`; });
    if(missing.length === 0) mList.innerHTML = `<li><i data-lucide="check-circle" style="color:#10b981; width:16px;"></i> Strong technical match!</li>`;
    lucide.createIcons();

    // 3. Re-evaluate Best Role Match
    let jobRole = "General Software Engineer";
    if (extractedSkills.includes('react') || extractedSkills.includes('css')) jobRole = "Front-End Developer";
    if (extractedSkills.includes('python') || extractedSkills.includes('java')) jobRole = "Back-End Developer";
    if (extractedSkills.includes('sql') && extractedSkills.includes('node')) jobRole = "Full-Stack Engineer";
    document.getElementById('job-role-match').textContent = jobRole;

    // 4. Update Overall Score logic
    const baseScore = Math.min((extractedSkills.length * 20) + 40, 98);
    document.getElementById("overall-score").textContent = baseScore;

    // 5. Redraw Radar Chart with Random Proficiency Seeds
    const ctx = document.getElementById('skillChart').getContext('2d');
    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: extractedSkills.map(l => l.toUpperCase()),
        datasets: [{
          label: 'Proficiency Match',
          data: extractedSkills.map(() => Math.floor(Math.random() * 30) + 70),
          backgroundColor: 'rgba(59, 130, 246, 0.4)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        }]
      },
      options: {
        scales: { r: { pointLabels: { color: '#94a3b8' }, ticks: { display: false, min: 0, max: 100 } } },
        plugins: { legend: { display:false } }, maintainAspectRatio: false
      }
    });
  }

  // --- Registration & Assessment Flow ---
  
  document.querySelectorAll(".level-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      userLevel = e.target.getAttribute("data-level");
      levelModal.classList.add("hidden");
      
      try { if(document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch(err) { }
      switchView(viewAssessment);
      initializeAssessment();
    });
  });

  async function initializeAssessment() {
    tabSwitchWarnings = 0;
    generatedQuestions = [];
    extractedSkills.forEach(skill => {
      // Fetches 5 uniquely random questions per topic dynamically
      generatedQuestions = generatedQuestions.concat(getSkillQuestions(skill, userLevel));
    });
    
    // Shuffle the global array
    generatedQuestions.sort(() => Math.random() - 0.5);

    correctAnswers = 0;
    userAnswers = [];
    
    const video = document.getElementById('webcam');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      video.srcObject = stream;
    } catch (err) { alert("Camera access is required for proctoring!"); }

    faceStatusDot.classList.replace('red', 'yellow');
    fetchModelsAndStartProctoring(video);
    startTimer();
    
    currentQuestionIndex = 0;
    loadQuestion(currentQuestionIndex);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", blockShortcut);
    document.addEventListener("cut", blockShortcut);
    document.addEventListener("paste", blockShortcut);
    document.addEventListener("contextmenu", blockShortcut);
  }
  
  async function fetchModelsAndStartProctoring(video) {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      faceStatusDot.classList.replace('yellow', 'green'); 
      
      let noFaceTicks = 0;
      proctoringInterval = setInterval(async () => {
        if (!video.videoWidth) return; 
        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }); 
        const detections = await faceapi.detectSingleFace(video, options);
        
        if (detections) {
          noFaceTicks = 0;
          camWarning.classList.add("hidden");
          faceStatusDot.classList.replace('red', 'green');
        } else {
          noFaceTicks++;
          if(noFaceTicks > 3) {
            camWarning.classList.remove("hidden");
            faceStatusDot.classList.replace('green', 'red');
          }
        }
      }, 1000);
    } catch (e) {
      console.error("AI Model Loading Error:", e);
    }
  }

  function handleVisibilityChange() {
    if (document.hidden && !viewAssessment.classList.contains("hidden")) {
      tabSwitchWarnings++;
      if (tabSwitchWarnings >= 3) {
        alert("FINAL WARNING: You have switched tabs 3 times. Your assessment is being automatically terminated.");
        endAssessment();
      } else {
        alert(`WARNING: Tab Switch Detected! (${tabSwitchWarnings}/3 allowed before termination)`);
      }
    }
  }

  function blockShortcut(e) { 
    if (!viewAssessment.classList.contains("hidden")) e.preventDefault(); 
  }

  function startTimer() {
    timeRemaining = generatedQuestions.length * 60; 
    const timerDisplay = document.getElementById("quiz-timer");
    timerInterval = setInterval(() => {
      timeRemaining--;
      const min = Math.floor(timeRemaining / 60);
      const sec = timeRemaining % 60;
      timerDisplay.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      if (timeRemaining <= 0) endAssessment();
    }, 1000);
  }

  function loadQuestion(index) {
    if (index >= generatedQuestions.length) return endAssessment();
    
    selectedOptionIndex = null;
    const btnNext = document.getElementById('btn-next-question');
    btnNext.disabled = true;
    document.getElementById('question-counter').textContent = `Question ${index + 1} / ${generatedQuestions.length}`;
    
    const qData = generatedQuestions[index];
    document.getElementById('question-text').textContent = `${qData.q}`;
    
    const optsGrid = document.getElementById('options-grid');
    optsGrid.innerHTML = '';
    
    qData.options.forEach((opt, optIdx) => {
      const btn = document.createElement('button');
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOptionIndex = optIdx;
        btnNext.disabled = false;
      });
      optsGrid.appendChild(btn);
    });
  }

  document.getElementById('btn-next-question').addEventListener('click', () => {
    const qData = generatedQuestions[currentQuestionIndex];
    const isCorrect = (selectedOptionIndex === qData.a);
    
    if(isCorrect) correctAnswers++;
    
    userAnswers.push({
      qObj: qData,
      selectedOptIdx: selectedOptionIndex,
      isCorrect: isCorrect
    });
    
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
  });
  
  function endAssessment() {
    clearInterval(timerInterval);
    if(proctoringInterval) clearInterval(proctoringInterval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    document.removeEventListener("copy", blockShortcut);
    document.removeEventListener("contextmenu", blockShortcut);
    
    try { if(document.fullscreenElement) document.exitFullscreen(); } catch(e){}
    
    const percentage = Math.round((correctAnswers / generatedQuestions.length) * 100);
    document.getElementById("final-score-text").textContent = `${percentage}%`;
    
    const statusText = document.getElementById("final-qualification");
    const feedbackText = document.getElementById("final-feedback");
    
    let statusStr = "NOT QUALIFIED";
    if (percentage >= 70) {
      statusStr = "QUALIFIED";
      statusText.textContent = "QUALIFIED";
      statusText.style.color = "#10b981"; 
      feedbackText.textContent = `Excellent work! You passed the baseline with a score of ${percentage}%.`;
    } else {
      statusText.textContent = "NOT QUALIFIED";
      statusText.style.color = "#ef4444"; 
      feedbackText.textContent = `You scored ${percentage}%. You need at least 70% to qualify for this level. Reach out to correct mistakes.`;
    }
    
    // Write Assessment Results to Backend Database
    try {
      fetch('http://127.0.0.1:3000/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: currentCompany,
          recruiter_name: currentRecruiter,
          name: candidateData.name || "Unknown Candidate",
          email: candidateData.email || "unknown@example.com",
          role: candidateData.role || "Unknown Role",
          score: percentage,
          status: statusStr,
          skills: extractedSkills.join(", ")
        })
      }).then(res => {
         if(!res.ok) console.error("API Error: ", res.status);
      }).catch(err => console.error("Fetch Error:", err));
    } catch(e) { console.error("Could not save to database", e); }
    
    // Evaluate Per-Skill Analytics
    const skillStats = {};
    extractedSkills.forEach(s => skillStats[s] = { total: 0, correct: 0 });
    userAnswers.forEach(ans => {
       if(skillStats[ans.qObj.skill]) {
         skillStats[ans.qObj.skill].total++;
         if(ans.isCorrect) skillStats[ans.qObj.skill].correct++;
       }
    });

    const progressContainer = document.getElementById("skill-progress-bars");
    progressContainer.innerHTML = '';
    for(const sk in skillStats) {
       const stat = skillStats[sk];
       if(stat.total === 0) continue;
       const p = Math.round((stat.correct / stat.total) * 100);
       progressContainer.innerHTML += `
         <div class="skill-bar-row">
           <div class="skill-bar-label"><span>${sk.toUpperCase()}</span> <span>${p}%</span></div>
           <div class="skill-bar-bg"><div class="skill-bar-fill" style="width: ${p}%; background: ${p>=70 ? '#10b981' : (p>=40 ? '#eab308' : '#ef4444')};"></div></div>
         </div>
       `;
    }

    // Populate Detailed Review
    const reviewContainer = document.getElementById("question-review-list");
    reviewContainer.innerHTML = '';
    userAnswers.forEach((ans, i) => {
       reviewContainer.innerHTML += `
         <div class="review-item ${ans.isCorrect ? 'correct' : 'wrong'}">
           <h4>Q${i+1}: ${ans.qObj.q}</h4>
           <div style="margin-top:0.5rem;">
             <p><strong>Your Answer:</strong> ${ans.qObj.options[ans.selectedOptIdx]} ${ans.isCorrect ? '<i data-lucide="check-circle-2" style="color:#10b981;width:18px;"></i>' : '<i data-lucide="x-circle" style="color:#ef4444;width:18px;"></i>'}</p>
             ${!ans.isCorrect ? `<p class="correct-answer-text"><strong>Correct Answer:</strong> ${ans.qObj.options[ans.qObj.a]}</p>` : ''}
           </div>
         </div>
       `;
    });
    lucide.createIcons();

    switchView(viewResults);
  }

  // --- Soft Restart Logic (Preserves Recruiter) ---
  document.getElementById("btn-restart")?.addEventListener("click", () => {
    candidateData = { name: "", email: "", role: "" };
    extractedSkills = [];
    generatedQuestions = [];
    userAnswers = [];
    correctAnswers = 0;
    document.getElementById("quiz-timer").textContent = "--:--";
    switchView(viewHub);
  });

  // --- Admin Dashboard Logic ---
  btnAdminHome.addEventListener("click", () => {
    currentCompany = "";
    currentRecruiter = "";
    if(document.getElementById("rec-company")) document.getElementById("rec-company").value = "";
    if(document.getElementById("rec-name")) document.getElementById("rec-name").value = "";
    if(document.getElementById("cand-company")) document.getElementById("cand-company").value = "";
    if(document.getElementById("cand-name")) document.getElementById("cand-name").value = "";
    if(document.getElementById("cand-email")) document.getElementById("cand-email").value = "";
    if(document.getElementById("cand-role")) document.getElementById("cand-role").value = "";
    switchView(viewRecruiterLogin);
  });

  async function loadAdminDatabase() {
    const tbody = document.getElementById("admin-table-body");
    const emptyState = document.getElementById("admin-empty-state");
    
    try {
      const res = await fetch('http://127.0.0.1:3000/api/candidates?company=' + encodeURIComponent(currentCompany) + '&t=' + Date.now());
      if (!res.ok) throw new Error("Failed to fetch");
      const db = await res.json();
      
      tbody.innerHTML = "";
      if(!db || db.length === 0) {
        emptyState.style.display = "block";
        return;
      }
      
      emptyState.style.display = "none";
      const revDb = db; // API already returns ORDER BY created_at DESC
    
    revDb.forEach(row => {
      const statusBadge = row.status === "QUALIFIED" ? `<span class="badge-pass">QUALIFIED</span>` : `<span class="badge-fail">NOT QUALIFIED</span>`;
      tbody.innerHTML += `
        <tr>
          <td>
            <div style="font-weight: 500;">${row.name}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">${row.email}</div>
          </td>
          <td>${row.role}</td>
          <td><span style="font-size: 0.85rem; background: rgba(255,255,255,0.1); padding: 0.3rem 0.6rem; border-radius: 4px; font-weight:600;">${row.skills.toUpperCase()}</span></td>
          <td style="font-weight: 700; font-size: 1.15rem; color: ${row.score >= 70 ? '#10b981' : '#ef4444'};">${row.score}%</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    });
    } catch (e) { console.error("Failed to load admin db", e); }
  }

  document.getElementById("btn-clear-db")?.addEventListener("click", async () => {
    if(!confirm("Are you sure you want to permanently delete all candidates from your company database?")) return;
    
    try {
      await fetch('http://127.0.0.1:3000/api/candidates?company=' + encodeURIComponent(currentCompany), { method: 'DELETE' });
      loadAdminDatabase();
      } catch (err) {
        console.error("Failed to clear database", err);
      }
  });

  // --- Document Export Logic ---
  const btnDownloadReport = document.getElementById("btn-download-report");
  if(btnDownloadReport) {
    btnDownloadReport.addEventListener("click", () => {
      if(userAnswers.length === 0) return alert("No assessment data to download.");
      
      const percentage = Math.round((correctAnswers / generatedQuestions.length) * 100);
      let statusStr = percentage >= 70 ? "QUALIFIED" : "NOT QUALIFIED";
      
      let reportContent = `======================================\n`;
      reportContent += `   PROCTOR-AI : ASSESSMENT REPORT\n`;
      reportContent += `======================================\n\n`;
      reportContent += `Candidate Name : ${candidateData.name || 'Unknown'}\n`;
      reportContent += `Email Address  : ${candidateData.email || 'Unknown'}\n`;
      reportContent += `Role Applied   : ${candidateData.role || 'Unknown'}\n`;
      reportContent += `Experience     : ${userLevel.toUpperCase()}\n`;
      reportContent += `Date           : ${new Date().toLocaleString()}\n\n`;
      reportContent += `--------------------------------------\n`;
      reportContent += `OVERALL SCORE  : ${percentage}%\n`;
      reportContent += `STATUS         : ${statusStr}\n`;
      reportContent += `Tested Skills  : ${extractedSkills.join(', ').toUpperCase()}\n`;
      reportContent += `--------------------------------------\n\n`;
      
      reportContent += `QUESTION-BY-QUESTION BREAKDOWN:\n\n`;
      userAnswers.forEach((ans, i) => {
         reportContent += `Q${i+1} [${ans.qObj.skill.toUpperCase()}]: ${ans.qObj.q}\n`;
         reportContent += `Candidate Answer : ${ans.qObj.options[ans.selectedOptIdx]} ${ans.isCorrect ? '(CORRECT)' : '(WRONG)'}\n`;
         if(!ans.isCorrect) {
           reportContent += `Correct Answer   : ${ans.qObj.options[ans.qObj.a]}\n`;
         }
         reportContent += `\n`;
      });
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(candidateData.name || 'Candidate').replace(/\s+/g, '_')}_Assessment_Report.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

});
