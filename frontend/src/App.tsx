import { Sidebar, type NavItem } from "./components/layout/Sidebar";
import Card from "./components/ui/Card";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ResetPasswordScreen from "./components/auth/ResetPasswordScreen"; 
import AppLogo from "./components/branding/AppLogo";
/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type Screen =
  | "landing"
  | "auth"
  | "reset-password"
  | "onboarding"
  | "dashboard"
  | "resume-upload"
  | "resume-history"
  | "resume-analysing"
  | "resume-results"
  | "interview-setup"
  | "interview-question"
  | "interview-feedback"
  | "interview-summary"
  | "progress"
  | "responsible-ai"
  | "job-match-input"
  | "job-match-analysing"
  | "job-match-results"
  | "resume-error"
  | "interview-generating"
  | "interview-error"
  | "interview-feedback-generating"
  | "interview-feedback-error"
  | "job-match-error";


const SCREEN_PATHS: Partial<Record<Screen, string>> = {
  landing: "/",
  auth: "/login",
  "reset-password": "/reset-password",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  "resume-upload": "/resume-feedback",
"resume-history": "/resume-feedback/history",
  "resume-results": "/resume-feedback/results",
  "interview-setup": "/interview-preparation",
  "interview-question": "/interview-preparation/practice",
  "interview-feedback": "/interview-preparation/feedback",
  "interview-summary": "/interview-preparation/summary",
  progress: "/progress",
  "responsible-ai": "/responsible-ai",
  "job-match-input": "/job-matching",
  "job-match-results": "/job-matching/results",
};
/* ─────────────────────────────────────────
   Dynamic Resume Feedback Engine
───────────────────────────────────────── */

interface FeedbackItem { observation: string; why: string; suggestion: string; priority: "High" | "Medium" | "Low"; }
interface FeedbackSection { title: string; icon: string; summary: string; items: FeedbackItem[]; }
interface ResumeFeedback {
  overview: string;
  targetRole: string;
  resumeLabel: string;
  roleRelevance: { strong: string[]; partial: string[]; missing: string[] };
  strengths: string[];
  sections: FeedbackSection[];
}
function mapAIResumeFeedback(
  apiData: any,
  fileName: string
): ResumeFeedback {
  const items = Array.isArray(apiData.feedback)
    ? apiData.feedback
    : [];
  const strengths = items
    .filter((item: any) => item.type === "strength")
    .map((item: any) => item.text);

  const improvements = items.filter(
    (item: any) =>
      item.type === "improvement" ||
      item.type === "recommendation"
  );

  const grouped = new Map<string, any[]>();

  items.forEach((item: any) => {
    const category = item.category || "General feedback";

    if (!grouped.has(category)) {
      grouped.set(category, []);
    }

    grouped.get(category)!.push(item);
  });

  const sections: FeedbackSection[] = Array.from(
    grouped.entries()
  ).map(([category, categoryItems]) => ({
    title: category,
    icon: "✦",
    summary: `AI feedback for ${category.toLowerCase()}.`,
    items: categoryItems.map((item: any) => ({
      observation: item.text,
      why:
        item.type === "strength"
          ? "This is a positive feature identified in your resume."
          : "This area may affect how clearly your experience and suitability are communicated.",
      suggestion: item.text,
      priority:
        item.priority === "high"
          ? "High"
          : item.priority === "low"
          ? "Low"
          : "Medium",
    })),
  }));

  return {
    overview:
      strengths.length > 0
        ? `Your resume shows relevant strengths for the ${
            apiData.target_role || "selected"
          } role. The AI analysis also identified ${
            improvements.length
          } area${improvements.length === 1 ? "" : "s"} where your resume could be strengthened.`
        : `The AI analysis identified ${
            improvements.length
          } area${improvements.length === 1 ? "" : "s"} where your resume could be strengthened.`,

    targetRole: apiData.target_role || "Not specified",

    resumeLabel: fileName || "Resume",

    roleRelevance: {
      strong: strengths,
      partial: improvements
        .filter((item: any) => item.priority !== "high")
        .map((item: any) => item.text),
      missing: improvements
        .filter((item: any) => item.priority === "high")
        .map((item: any) => item.text),
    },

    strengths,

    sections,
  };
}


type ResumeType = "it-grad" | "nurse" | "marketing" | "generic";

function detectResumeType(text: string): ResumeType {
  const t = text.toLowerCase();
  const itScore = (t.match(/python|java|sql|aws|git|software|developer|programming|database|api|react|node|algorithm|cloud|docker|kubernetes|agile|scrum/g) || []).length;
  const nurseScore = (t.match(/nursing|nurse|clinical|patient|ward|hospital|healthcare|medication|care|medical|placement|registered|midwife/g) || []).length;
  const mktScore = (t.match(/marketing|campaign|social media|content|seo|digital|brand|analytics|engagement|advertising|copywriting|crm|hubspot/g) || []).length;
  if (nurseScore >= 2) return "nurse";
  if (mktScore >= 2) return "marketing";
  if (itScore >= 2) return "it-grad";
  return "generic";
}

function detectRoleCategory(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("data analyst") || r.includes("data science")) return "data";
  if (r.includes("support") || r.includes("helpdesk") || r.includes("it support")) return "itsupport";
  if (r.includes("cyber") || r.includes("security analyst") || r.includes("infosec")) return "cyber";
  if (r.includes("software") || r.includes("developer") || r.includes("engineer") || r.includes("full stack") || r.includes("backend") || r.includes("frontend")) return "software";
  if (r.includes("nurs") || r.includes("midwi") || r.includes("healthcare") || r.includes("clinical")) return "nursing";
  if (r.includes("market") || r.includes("coordinator") || r.includes("brand") || r.includes("digital")) return "marketing";
  return "general";
}

function generateFeedback(resumeText: string, targetRole: string, fileName: string): ResumeFeedback {
  const resumeType = detectResumeType(resumeText);
  const roleCategory = detectRoleCategory(targetRole);
  const t = resumeText.toLowerCase();

  // ── IT Graduate resume ──────────────────────────────────────────
  if (resumeType === "it-grad" && roleCategory === "software") {
    return {
      overview: "Your resume demonstrates a solid technical foundation for a Software Developer role. You have listed relevant programming languages and include university project experience. The main opportunities for improvement are connecting your technical skills to concrete project outcomes and presenting your experience using achievement-oriented language typical of Australian graduate applications.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Python, Java and SQL directly align with Software Developer requirements", "University software projects demonstrate practical application of skills", "Academic qualification in IT provides foundational credibility"],
        partial: ["Technical skills are listed but not connected to specific work or project contexts", "Project descriptions mention technologies but do not clearly describe outcomes or your individual contribution"],
        missing: ["No mention of version control (Git/GitHub) was identified in the provided resume", "Software development methodology experience (Agile, Scrum) was not identified", "No evidence of API design, integration or testing was found"],
      },
      strengths: [
        "Your resume includes Python, Java and SQL — three skills directly relevant to most Software Developer roles in Australia.",
        "Including university projects shows practical application of technical knowledge, which is valued in graduate hiring.",
        "Your academic qualification in Information Technology establishes a credible foundation for the target role.",
      ],
      sections: [
        { title: "Skills", icon: "⚙️", summary: "Technical skills are present but need stronger contextualisation.", items: [
          { observation: "Your resume lists Python, Java and SQL in a skills section.", why: "These are relevant to the Software Developer role, but listing skills without context makes it difficult for employers to assess your depth of experience.", suggestion: "For each key skill, briefly note the context — e.g. 'Python (data processing scripts, university projects)' — to demonstrate applied experience rather than theoretical knowledge.", priority: "High" },
          { observation: "No mention of Git or GitHub was identified in the provided resume.", why: "Version control is considered a baseline expectation for Software Developer roles in Australia. Its absence may raise questions for technical reviewers.", suggestion: "If you have used Git in your university projects or personal work, add it explicitly to your skills section and reference it in relevant project descriptions.", priority: "High" },
        ]},
        { title: "Projects", icon: "🗂", summary: "Projects exist but outcomes need to be more prominent.", items: [
          { observation: "Your university projects are listed with technology descriptions but limited outcome information.", why: "Australian graduate employers look for evidence of what you built and what it achieved — not only what technologies you used.", suggestion: "For each project, add one or two sentences describing the outcome: what the system did, who used it, or what problem it solved. Where accurate, include a quantitative detail such as 'reduced processing time by approximately 30%'.", priority: "High" },
          { observation: "The individual contribution within group projects is not clearly stated.", why: "Employers need to understand your specific role in team projects to assess your capabilities accurately.", suggestion: "Add a brief note to each team project clarifying your individual responsibility — e.g. 'Responsible for backend API design and database integration'.", priority: "Medium" },
        ]},
        { title: "Experience", icon: "💼", summary: "Work experience descriptions focus on duties rather than outcomes.", items: [
          { observation: "Experience descriptions use duty-focused language such as 'responsible for' and 'assisted with'.", why: "Australian employers typically respond better to achievement-oriented language that demonstrates impact rather than task completion.", suggestion: "Rewrite at least two experience bullet points using action verbs and outcome-focused language. For example: 'Developed a Python script that automated weekly data processing, reducing manual effort by approximately four hours per week' — only if this is accurate.", priority: "High" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "A few Australian-specific elements could be added.", items: [
          { observation: "A LinkedIn profile link was not identified in the provided resume.", why: "Many Australian graduate employers expect a LinkedIn profile as part of the application package.", suggestion: "Add a professional LinkedIn profile URL in your contact section, and ensure your LinkedIn profile is up to date and consistent with your resume.", priority: "Medium" },
          { observation: "A referees section or 'referees available on request' note is not included.", why: "Australian resumes typically acknowledge referees, even if details are provided separately.", suggestion: "Add a brief referees section at the end of your resume, or note 'Referees available upon request'.", priority: "Low" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "Structure is clear; minor consistency improvements would help.", items: [
          { observation: "Section headings appear consistently formatted, which is a positive indicator.", why: "Consistent formatting is a signal of attention to detail valued in technical roles.", suggestion: "Ensure the same formatting is applied to all date ranges and location details for a fully polished appearance.", priority: "Low" },
        ]},
      ],
    };
  }

  if (resumeType === "it-grad" && roleCategory === "data") {
    return {
      overview: "Your IT graduate resume contains several skills relevant to a Data Analyst role — particularly Python and SQL. However, the resume is currently framed around software development. To strengthen the application for Data Analyst positions, you should foreground your analytical and data-handling experience and connect your technical skills explicitly to data tasks.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Python is directly relevant and widely used in data analysis workflows", "SQL demonstrates database querying capability, a core Data Analyst skill", "Academic IT background provides a credible quantitative foundation"],
        partial: ["University projects may include data tasks but are currently framed as software projects", "Some analytical thinking is implied but not explicitly positioned for a data context"],
        missing: ["No mention of data visualisation tools (Tableau, Power BI, matplotlib, seaborn) was identified", "Statistical analysis or data modelling experience was not identified in the provided resume", "No mention of working with datasets, data cleaning or exploratory analysis was found"],
      },
      strengths: [
        "Python and SQL are the two most commonly required skills in Data Analyst job descriptions in Australia — your resume already includes both.",
        "An IT academic background signals quantitative capability that many Data Analyst employers value.",
        "Including university projects provides a foundation to demonstrate applied analytical work, even without industry experience.",
      ],
      sections: [
        { title: "Skills", icon: "⚙️", summary: "Strong technical base, but data-specific tools are not represented.", items: [
          { observation: "Your resume lists Python and SQL but does not identify any data visualisation or analysis libraries.", why: "Data Analyst roles in Australia typically expect familiarity with tools such as Pandas, NumPy, matplotlib or Tableau alongside Python and SQL.", suggestion: "If you have used any of these tools in projects or coursework, add them explicitly. For example: 'Python (Pandas, NumPy, matplotlib — data analysis projects)'.", priority: "High" },
          { observation: "No statistical analysis or data modelling skills were identified in the provided resume.", why: "Data Analyst roles often require basic statistical understanding — correlation, regression, hypothesis testing — even at graduate level.", suggestion: "If your IT coursework included statistics or data analytics subjects, add these explicitly to your education or skills sections.", priority: "High" },
        ]},
        { title: "Projects", icon: "🗂", summary: "Projects exist but are not positioned for a data audience.", items: [
          { observation: "University projects are described using software development framing rather than data analysis framing.", why: "Employers reviewing Data Analyst applications look for evidence of working with data, drawing insights, and presenting findings — not only building software.", suggestion: "Review your existing project descriptions and reframe any data-related work. If a project involved data processing, querying or reporting, describe it in those terms — e.g. 'Analysed a dataset of X records using Python and SQL to identify Y'.", priority: "High" },
        ]},
        { title: "Experience", icon: "💼", summary: "Work experience could be reframed to highlight analytical thinking.", items: [
          { observation: "Work experience descriptions do not currently highlight any data-handling or analytical tasks.", why: "Even in non-analytical roles, evidence of working with numbers, reports, or systems is transferable to Data Analyst positions.", suggestion: "Review your experience entries and identify any tasks involving data, reporting, or problem-solving. Reframe these using data-relevant language where accurate.", priority: "Medium" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "Standard Australian conventions apply.", items: [
          { observation: "A LinkedIn profile link was not identified in the provided resume.", why: "LinkedIn is widely used by Data Analyst recruiters in Australia to screen candidates.", suggestion: "Add your LinkedIn profile URL and ensure your profile reflects your interest in data analyst roles.", priority: "Medium" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "No significant structural issues identified.", items: [
          { observation: "The resume structure is clear and readable.", why: "Clear structure is particularly important when applying for analytical roles, as it demonstrates logical thinking.", suggestion: "No major changes required. Consider reordering sections to place your most data-relevant experience first.", priority: "Low" },
        ]},
      ],
    };
  }

  if (resumeType === "it-grad" && roleCategory === "itsupport") {
    return {
      overview: "Your IT graduate resume has a solid technical foundation, and some of your experience is transferable to an IT Support Officer role. However, the resume is currently framed around software development and projects. To be competitive for IT Support positions, you should foreground your customer-facing experience, troubleshooting skills, and communication capabilities.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Technical IT background directly supports understanding of systems and hardware", "Any customer service or team experience is highly transferable to IT support contexts", "Academic IT qualification demonstrates foundational systems knowledge"],
        partial: ["Technical skills are present but not positioned for a support or troubleshooting context", "Project experience demonstrates problem-solving but is framed as development work"],
        missing: ["No explicit mention of helpdesk, ticketing systems or technical support experience was identified", "Hardware, networking or operating systems knowledge was not clearly described in the provided resume", "Communication and customer-facing skills are not explicitly highlighted"],
      },
      strengths: [
        "Your IT academic background provides the systems knowledge expected in IT Support roles.",
        "Any customer service experience in your work history is directly relevant and should be prominently featured.",
        "Problem-solving through university projects demonstrates analytical thinking valued in support environments.",
      ],
      sections: [
        { title: "Skills", icon: "⚙️", summary: "Technical skills present; support-specific skills underrepresented.", items: [
          { observation: "Your skills section lists programming languages but does not mention operating systems, networking, or hardware.", why: "IT Support roles typically require familiarity with Windows, macOS, Active Directory, networking basics and common productivity tools.", suggestion: "Add operating system and networking skills explicitly if you have them. For example: 'Windows 10/11 administration, basic networking (TCP/IP, DNS), Active Directory'.", priority: "High" },
          { observation: "No mention of ticketing systems or IT support tools was found in the provided resume.", why: "Many Australian IT Support roles expect familiarity with helpdesk or ticketing platforms such as ServiceNow, Jira Service Desk or Zendesk.", suggestion: "If you have used any helpdesk tools in study or work, add them to your skills section.", priority: "Medium" },
        ]},
        { title: "Experience", icon: "💼", summary: "Customer service experience should be more prominently featured.", items: [
          { observation: "Any customer service or communication-oriented experience in your resume is currently given limited prominence.", why: "IT Support roles require strong communication skills to assist users with varying levels of technical knowledge. This experience is directly transferable.", suggestion: "Reorder your experience section so customer-facing or communication-oriented roles appear before technical project experience when targeting IT Support applications.", priority: "High" },
          { observation: "Experience descriptions focus on technical tasks rather than support or troubleshooting scenarios.", why: "IT Support employers look for evidence of resolving problems under pressure and communicating solutions clearly.", suggestion: "Where accurate, add examples of resolving technical or operational problems — even in non-IT roles. For example: 'Resolved point-of-sale technical issues during peak trade periods'.", priority: "Medium" },
        ]},
        { title: "Projects", icon: "🗂", summary: "Projects demonstrate problem-solving but need support framing.", items: [
          { observation: "University projects are described in a software development context.", why: "While the technical work is relevant, IT Support employers may not immediately recognise the connection to a support role.", suggestion: "Add a brief note to relevant projects describing the troubleshooting or systems-administration aspects — even if they were a minor part of the project.", priority: "Low" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "Standard Australian conventions apply.", items: [
          { observation: "Referees section was not identified in the provided resume.", why: "IT Support employers often check referees early in the process.", suggestion: "Add a referees section or note 'Referees available upon request' at the end of your resume.", priority: "Low" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "No significant structural issues identified.", items: [
          { observation: "Resume structure is clear and easy to navigate.", why: "Readability is important in IT Support applications, as it reflects communication skills.", suggestion: "No major changes required. Ensure your contact details are at the top and easy to find.", priority: "Low" },
        ]},
      ],
    };
  }

  // ── Nursing resume ──────────────────────────────────────────────
  if (resumeType === "nurse" && roleCategory === "nursing") {
    return {
      overview: "Your resume clearly communicates a clinical background relevant to a Registered Nurse application. Your clinical placement experience and patient care responsibilities are well represented. The primary opportunity is to strengthen achievement-oriented language and ensure your AHPRA registration and qualifications are prominently featured.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Clinical placement experience directly demonstrates patient care capability", "Nursing qualification is essential and identified in the provided resume", "Patient care responsibilities align with core Registered Nurse requirements"],
        partial: ["Clinical skills are described but outcomes and specific clinical contexts could be clearer", "Communication skills are implied but not explicitly evidenced in the resume"],
        missing: ["AHPRA registration number or status was not clearly identified in the provided resume", "Specific clinical specialisations or ward types were not clearly described", "Evidence of medication administration competency was not identified"],
      },
      strengths: [
        "Your clinical placement experience is directly relevant and demonstrates exposure to real patient care environments.",
        "The nursing qualification listed on your resume satisfies the essential requirement for most Registered Nurse positions in Australia.",
        "Patient care responsibilities described in your resume demonstrate understanding of nursing fundamentals.",
      ],
      sections: [
        { title: "Qualifications & Registration", icon: "🎓", summary: "Qualification is present; registration details need prominence.", items: [
          { observation: "Your nursing qualification is listed but AHPRA registration details are not clearly prominent in the provided resume.", why: "Australian employers hiring Registered Nurses require confirmation of AHPRA registration. Its absence or unclear positioning can delay shortlisting.", suggestion: "Add your AHPRA registration number or status clearly in your contact details or a dedicated registration section at the top of your resume.", priority: "High" },
        ]},
        { title: "Clinical Experience", icon: "🏥", summary: "Clinical placement is well described; more specificity would strengthen it.", items: [
          { observation: "Your clinical placement is described in terms of patient care responsibilities but does not specify the clinical setting or specialisation.", why: "Employers look for relevant clinical context — e.g. acute care, aged care, mental health, paediatrics — to assess fit with the available position.", suggestion: "Specify the clinical setting for each placement — e.g. 'Medical-Surgical Ward, 300-bed metropolitan hospital'. Include the patient population and any specific clinical skills practised.", priority: "High" },
          { observation: "Medication administration is not explicitly described in the provided resume.", why: "Medication competency is a core expectation for Registered Nurse roles in most Australian healthcare settings.", suggestion: "If you have demonstrated medication administration competency during placement, state this explicitly in your clinical experience section.", priority: "High" },
        ]},
        { title: "Skills", icon: "⚙️", summary: "Clinical skills section could be more comprehensive.", items: [
          { observation: "The skills section does not explicitly list clinical competencies such as wound care, vital signs monitoring, or IV cannulation.", why: "Clinical skills lists help employers quickly assess readiness for the clinical environment.", suggestion: "Add a dedicated clinical skills section listing all competencies you have demonstrated or been assessed in during training and placement.", priority: "Medium" },
        ]},
        { title: "Professional Summary", icon: "👤", summary: "Summary is present but could be more targeted.", items: [
          { observation: "The professional summary describes your background generally rather than connecting it to the specific Registered Nurse role.", why: "A targeted summary helps a busy nurse manager immediately understand your value and fit.", suggestion: "Revise your summary to mention your clinical specialisation interest, key competencies, and AHPRA registration status in two to three concise sentences.", priority: "Medium" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "Specific Australian nursing application conventions apply.", items: [
          { observation: "The resume does not reference any completion of the Nursing and Midwifery Board of Australia (NMBA) competency standards.", why: "Australian nursing employers expect graduates to demonstrate alignment with NMBA competency standards.", suggestion: "Consider adding a brief statement in your professional summary or skills section acknowledging NMBA competency standards if this is applicable to your qualification.", priority: "Low" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "Well structured for a clinical application.", items: [
          { observation: "Your resume structure is clear and professional.", why: "Clarity is important in healthcare applications where hiring managers review many applications.", suggestion: "Ensure your most relevant clinical experience appears immediately after your qualifications section.", priority: "Low" },
        ]},
      ],
    };
  }

  // ── Marketing resume ─────────────────────────────────────────────
  if (resumeType === "marketing" && roleCategory === "marketing") {
    return {
      overview: "Your resume demonstrates relevant marketing experience that directly supports an application for a Marketing Coordinator role. Your campaign and social media experience is well positioned. The main opportunity is to include measurable outcomes for your campaigns and to better connect your digital marketing skills to the specific responsibilities of a coordinator role.",
      targetRole: targetRole, resumeLabel: fileName,
      roleRelevance: {
        strong: ["Social media and content experience directly aligns with Marketing Coordinator requirements", "Campaign involvement demonstrates practical marketing knowledge", "Communication and creative skills are evidenced throughout the resume"],
        partial: ["Campaign descriptions mention activities but not measurable outcomes", "Digital marketing skills are present but platforms and tools could be specified more clearly"],
        missing: ["Measurable campaign performance data (reach, engagement rate, leads generated) was not identified in the provided resume", "Experience with marketing analytics tools (Google Analytics, Meta Business Suite) was not clearly stated", "CRM or email marketing platform experience was not identified"],
      },
      strengths: [
        "Your social media and content experience is directly applicable to a Marketing Coordinator role and is well demonstrated in your resume.",
        "Campaign involvement — even in a supporting or student capacity — shows practical marketing knowledge that employers value in graduate candidates.",
        "Your communication background is a transferable strength for coordinator roles that involve stakeholder and agency liaison.",
      ],
      sections: [
        { title: "Campaign Experience", icon: "📢", summary: "Campaign experience is present; outcomes need to be more prominent.", items: [
          { observation: "Your resume describes campaign involvement but does not include measurable outcomes or performance results.", why: "Australian marketing employers look for evidence of campaign effectiveness — reach, engagement rates, leads generated, conversion — even in junior or student roles.", suggestion: "Where accurate, add one performance metric per campaign. For example: 'Managed social media content for X campaign, achieving Y% increase in engagement over the campaign period'. Only include figures you can verify.", priority: "High" },
          { observation: "The specific marketing channels managed are not consistently described.", why: "Marketing Coordinator roles often require experience with specific channels — Instagram, LinkedIn, email, paid search — and employers scan for these.", suggestion: "For each campaign or role, list the specific channels you managed or contributed to.", priority: "High" },
        ]},
        { title: "Digital Skills", icon: "💻", summary: "Digital skills are implied but specific tools are not listed.", items: [
          { observation: "Your skills section mentions digital marketing but does not specify platforms or tools.", why: "Employers look for familiarity with specific tools — Google Analytics, Canva, Hootsuite, Mailchimp, Meta Business Suite — to assess readiness.", suggestion: "Add a digital tools section or expand your skills section to list the specific platforms and tools you have used, even in a student or volunteer context.", priority: "High" },
        ]},
        { title: "Content Creation", icon: "✏️", summary: "Content experience is referenced but could be better evidenced.", items: [
          { observation: "Content creation is mentioned but the types of content (copy, graphics, video, blog) are not specified.", why: "Marketing Coordinator roles typically require a range of content skills. Specifying your content types demonstrates versatility.", suggestion: "List the specific content formats you have created — e.g. 'Social media copy, promotional graphics (Canva), blog posts, email newsletters'.", priority: "Medium" },
        ]},
        { title: "Analytics", icon: "📊", summary: "No analytics experience was identified.", items: [
          { observation: "Evidence of using marketing analytics tools or interpreting campaign data was not identified in the provided resume.", why: "Marketing Coordinators in Australia are increasingly expected to report on and interpret campaign performance data.", suggestion: "If you have used Google Analytics, Meta Insights, or any other reporting tool — even in a university project — add this to your skills section and reference it in relevant experience descriptions.", priority: "Medium" },
        ]},
        { title: "Australian Context", icon: "🇦🇺", summary: "Generally well suited to Australian marketing applications.", items: [
          { observation: "The resume does not mention any internship, volunteer marketing work, or student marketing association involvement.", why: "Australian marketing employers value demonstrated initiative and real-world exposure, particularly for graduate candidates.", suggestion: "If you have undertaken any marketing-related volunteer, internship or extra-curricular work, include it — even if informal.", priority: "Low" },
        ]},
        { title: "Structure & Formatting", icon: "📄", summary: "Clear and professional structure.", items: [
          { observation: "Resume structure is clean and professional.", why: "For a marketing role, visual presentation signals attention to brand and communication standards.", suggestion: "Ensure your formatting is consistent and that your most relevant experience appears first. Consider whether a brief portfolio link could be included if you have one.", priority: "Low" },
        ]},
      ],
    };
  }

  // ── Generic fallback ──────────────────────────────────────────────
  return {
    overview: `Your resume has been reviewed in the context of a ${targetRole} application. The feedback below is based on the information provided. To receive more targeted feedback, ensure your resume content and target role are as specific as possible.`,
    targetRole: targetRole, resumeLabel: fileName,
    roleRelevance: {
      strong: ["Relevant qualifications identified in the provided resume", "Work experience demonstrates professional capability"],
      partial: ["Some experience may be relevant to the target role but could be presented more clearly", "Skills section could be better aligned to role requirements"],
      missing: ["Role-specific technical skills or certifications were not clearly identified in the provided resume", "Measurable achievements were not identified — consider adding these where accurate"],
    },
    strengths: [
      "Your resume has a clear, readable structure that is easy for employers to navigate.",
      "Work experience is described in a professional tone consistent with Australian workplace expectations.",
    ],
    sections: [
      { title: "Professional Summary", icon: "👤", summary: "Summary could be more targeted to the role.", items: [
        { observation: "The professional summary does not explicitly reference the target role or connect your background to it.", why: "A targeted summary is one of the most effective ways to immediately signal your fit for a specific role.", suggestion: "Revise your summary to name the target role and highlight two or three specific capabilities that make you suited to it.", priority: "High" },
      ]},
      { title: "Skills", icon: "⚙️", summary: "Skills section present but could be better aligned to the role.", items: [
        { observation: "The skills listed do not clearly map to the requirements of the target role.", why: "Employers and applicant tracking systems scan for role-specific skills. A mismatch reduces the chance of shortlisting.", suggestion: "Review the job description for the target role and ensure your most relevant skills are listed clearly and specifically.", priority: "High" },
      ]},
      { title: "Experience", icon: "💼", summary: "Experience is described but achievement-oriented language could be stronger.", items: [
        { observation: "Experience descriptions use duty-focused language rather than outcome-focused language.", why: "Achievement-oriented language is consistently preferred in Australian graduate applications.", suggestion: "Rewrite at least two bullet points per role to begin with a strong action verb and, where accurate, describe a measurable outcome.", priority: "High" },
      ]},
      { title: "Structure & Formatting", icon: "📄", summary: "Clear structure; minor improvements possible.", items: [
        { observation: "Heading and date formatting appears to be generally consistent.", why: "Consistent formatting signals attention to detail.", suggestion: "Review the full document for any inconsistencies in font weight, bullet style or spacing.", priority: "Low" },
      ]},
    ],
  };
}

/* ─────────────────────────────────────────
   Constants / data
───────────────────────────────────────── */
const RESUME_SECTIONS = [
  {
    title: "Structure & Formatting",
    icon: "📄",
    summary: "Clear structure with some inconsistencies to address.",
    items: [
      {
        observation: "Section headings are not consistently formatted throughout the document.",
        why: "Consistent formatting signals attention to detail, which is valued in Australian professional contexts.",
        suggestion: "Apply a uniform style — same font weight, size and spacing — to all section headings.",
      },
      {
        observation: "The document uses multiple font sizes without a clear hierarchy.",
        why: "Visual clarity helps recruiters scan quickly, especially in high-volume hiring contexts.",
        suggestion: "Limit to two or three font sizes and apply them consistently across the document.",
      },
    ],
  },
  {
    title: "Professional Summary",
    icon: "👤",
    summary: "Summary is present but could be better tailored to the Australian context.",
    items: [
      {
        observation: "The professional summary describes your background but does not connect it to the target role.",
        why: "Tailoring your summary to the specific role demonstrates focus and genuine interest to employers.",
        suggestion: "Revise the summary to mention the target role or industry, and highlight one or two relevant strengths.",
      },
    ],
  },
  {
    title: "Skills & Experience",
    icon: "💼",
    summary: "Strong experience section; some descriptions focus on duties rather than outcomes.",
    items: [
      {
        observation: "Experience descriptions focus mainly on responsibilities rather than outcomes.",
        why: "Australian employers often look for evidence of impact and achievement, not just task completion.",
        suggestion: "Where accurate, describe measurable outcomes or specific contributions alongside your responsibilities.",
      },
      {
        observation: "Technical skills are listed without context or proficiency level.",
        why: "Context helps employers understand the depth of your experience with each skill.",
        suggestion: "Consider grouping skills by category and noting where you have applied them professionally or academically.",
      },
    ],
  },
  {
    title: "Clarity & Language",
    icon: "✏️",
    summary: "Language is clear; a few phrases could be more concise.",
    items: [
      {
        observation: "Some bullet points begin with passive constructions rather than action verbs.",
        why: "Active, outcome-focused language reads more confidently in Australian resumes.",
        suggestion: "Begin each bullet point with a strong action verb such as 'Led', 'Developed', 'Coordinated', or 'Delivered'.",
      },
    ],
  },
  {
    title: "Relevance to Target Role",
    icon: "🎯",
    summary: "Good foundational alignment; a few adjustments would strengthen the match.",
    items: [
      {
        observation: "Several experiences listed may not be immediately relevant to the target role.",
        why: "Recruiters spend limited time on each resume; prioritising relevant experience helps make a strong first impression.",
        suggestion: "Reorder experiences so the most relevant roles and projects appear earlier within each section.",
      },
    ],
  },
  {
    title: "Suggested Improvements",
    icon: "💡",
    summary: "Three key changes would meaningfully strengthen this resume.",
    items: [
      {
        observation: "A LinkedIn or professional profile link is not included.",
        why: "Many Australian employers expect a LinkedIn profile as part of a graduate application.",
        suggestion: "Add a professional LinkedIn profile link in your contact section, ensuring your profile is complete and up to date.",
      },
      {
        observation: "The resume does not include a referees section or 'referees available on request'.",
        why: "Australian employers often expect referees to be acknowledged in the resume.",
        suggestion: "Add a brief referees section at the end of your resume.",
      },
    ],
  },
];

/* ─────────────────────────────────────────
   Interview question bank
───────────────────────────────────────── */
interface IQ {
  q: string;
  guidance: string;
  type: "Behavioural" | "General Graduate" | "Role-Specific";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  sampleAnswer: string;
}
interface InterviewAIFeedback {
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  next_steps: string[];
}
const BEHAVIOURAL: IQ[] = [
  {
    q: "Tell me about a time you worked effectively as part of a team.",
    guidance: "Use the STAR structure: describe the Situation, your Task, the Actions you took, and the Result.",
    type: "Behavioural", difficulty: "Beginner",
    sampleAnswer: "During a university software development project, I worked in a team of four students to build a web application. I was responsible for the database component and coordinating it with the frontend. When we experienced integration problems, I organised a short meeting, identified the conflicting data requirements and worked with the frontend developer to resolve them. We completed the project on time and successfully demonstrated the application. The experience strengthened my communication and teamwork skills.",
  },
  {
    q: "Describe a time you had to learn a new skill or tool quickly.",
    guidance: "Be specific about what you learned, how you approached it, and what the outcome was.",
    type: "Behavioural", difficulty: "Beginner",
    sampleAnswer: "During an internship, I was asked to produce a data report using Tableau, which I had not used before. I completed online tutorials over two evenings, practised with the project data, and sought feedback from a colleague. Within the week I produced the report to the required standard. The experience showed me that I can learn new technical tools efficiently under time pressure.",
  },
  {
    q: "Tell me about a time you made a mistake. What happened and what did you learn?",
    guidance: "Choose a genuine example. Focus on what you did to address it and what you took from the experience.",
    type: "Behavioural", difficulty: "Beginner",
    sampleAnswer: "During a group assignment, I misread the submission deadline and submitted our work a day late, which cost the team marks. I immediately informed the group, apologised, and spoke with our tutor. I then set up a shared calendar for all future deadlines. Since then I have not missed a submission. The experience taught me to verify deadlines and communicate promptly when problems arise.",
  },
  {
    q: "Describe a situation where you had to manage competing priorities under pressure.",
    guidance: "Explain what the competing demands were, how you decided what to prioritise, and what the outcome was.",
    type: "Behavioural", difficulty: "Intermediate",
    sampleAnswer: "In my final semester I was managing a major capstone project, two assessments and a part-time job simultaneously. I listed all deadlines, identified which tasks were most time-sensitive and highest-stakes, and blocked time in my calendar for each. I communicated with my project team when I needed to adjust meeting times and asked my employer to reduce my hours for two weeks. I met every deadline, and the capstone project received a distinction.",
  },
  {
    q: "Tell me about a time you had a disagreement with a colleague or team member. How did you handle it?",
    guidance: "Focus on how you addressed the disagreement constructively. Avoid speaking negatively about the other person.",
    type: "Behavioural", difficulty: "Intermediate",
    sampleAnswer: "During a group project, a team member and I disagreed on the technical approach to use. Rather than debating in the group chat, I suggested we discuss it one-on-one. I listened to their reasoning, shared mine, and we identified that both approaches had merit for different parts of the project. We presented two options to the group and agreed on a combined solution. The final project was stronger for it, and our working relationship remained positive.",
  },
  {
    q: "Give an example of a time you had to adapt to a significant change. How did you manage it?",
    guidance: "Describe the change, your initial reaction, and the specific steps you took to adapt successfully.",
    type: "Behavioural", difficulty: "Intermediate",
    sampleAnswer: "Partway through my placement, our clinical team changed to a new electronic medical records system with two days' notice. I attended the briefing, completed the available training module that evening and asked experienced colleagues for tips during quiet moments on the ward. Within three days I was using the system confidently and was able to help a colleague who was finding it difficult. I found that approaching change as a learning opportunity rather than a disruption made the transition much easier.",
  },
  {
    q: "Describe a situation where you identified a problem others had not noticed and took initiative to resolve it.",
    guidance: "Focus on how you identified the problem, what you did without being asked, and what the outcome was.",
    type: "Behavioural", difficulty: "Advanced",
    sampleAnswer: "While reviewing monthly sales data for my team, I noticed a pattern of returns that had not been flagged. I investigated further, identified that a product category was being miscategorised at point of sale, and raised it with my supervisor with supporting evidence. I proposed a short-term fix and a longer-term process change. The fix was implemented that week, reducing the misclassification rate by over 80 percent. My manager credited the catch to me in a team meeting.",
  },
  {
    q: "Tell me about a time you had to influence someone without formal authority to achieve an outcome.",
    guidance: "Describe the stakeholder, the goal, and the approach you used to build agreement without relying on authority.",
    type: "Behavioural", difficulty: "Advanced",
    sampleAnswer: "As a student project leader, I needed a team member to take on additional work after another member became unavailable. Rather than simply allocating the tasks, I met with them, acknowledged their existing workload, explained the impact on the project, and asked for their input on how we could share the burden fairly. They agreed and suggested splitting the tasks with another member. By involving them in the solution, I secured their commitment and the project was completed on time.",
  },
  {
    q: "Describe the most complex project or challenge you have managed. What was your approach?",
    guidance: "Choose an example that demonstrates planning, stakeholder communication, and resilience. Explain your specific role.",
    type: "Behavioural", difficulty: "Advanced",
    sampleAnswer: "My university capstone project required a team of five to design and build a full-stack application for a simulated client over one semester. I coordinated weekly sprints, managed the backlog, facilitated communication between the frontend and backend subteams, and presented progress to our supervisor fortnightly. When we encountered a major technical blocker in week eight, I reorganised priorities, brought the team together to problem-solve, and we completed a reduced but fully functional scope on time. The project received a high distinction and was selected for a faculty showcase.",
  },
];

const GRADUATE: IQ[] = [
  {
    q: "Why are you interested in this graduate role, and what strengths would you bring to the organisation?",
    guidance: "Connect your studies and skills to the role. Show you understand what the organisation does and why it appeals to you.",
    type: "General Graduate", difficulty: "Beginner",
    sampleAnswer: "I am interested in this graduate role because it would allow me to apply the technical knowledge I developed through my IT studies while continuing to learn in a professional environment. Through university projects, I have developed skills in programming, databases, teamwork and problem-solving. I am keen to contribute these skills while gaining practical industry experience and growing within the organisation.",
  },
  {
    q: "What are your key strengths, and how have you demonstrated them during your studies?",
    guidance: "Choose two or three genuine strengths and support each with a brief, specific example.",
    type: "General Graduate", difficulty: "Beginner",
    sampleAnswer: "One of my key strengths is analytical thinking. During my studies I consistently approached assessments by breaking complex problems into components and evaluating evidence before drawing conclusions. A second strength is communication — I have presented research findings to mixed audiences including academics and peers, and I received positive feedback on clarity and structure. I also consider myself reliable: group members have regularly asked me to take a coordinating role because of my follow-through.",
  },
  {
    q: "Where do you see yourself professionally in three to five years?",
    guidance: "Show genuine ambition that is realistic and connected to the role. Avoid vague statements.",
    type: "General Graduate", difficulty: "Beginner",
    sampleAnswer: "Over the next three to five years, I would like to develop strong technical and professional foundations in this role and take on increasing responsibility as I build my skills. I am particularly interested in developing expertise in data analysis and growing into a position where I can contribute to strategic decisions. I see this organisation as a place where I can develop those capabilities with strong mentorship and exposure to meaningful work.",
  },
  {
    q: "How do you approach learning a new skill or entering an unfamiliar work environment?",
    guidance: "Describe a specific method or example. Show self-direction, openness to feedback and resilience.",
    type: "General Graduate", difficulty: "Intermediate",
    sampleAnswer: "When I encounter a new skill or environment, I start by seeking out structured resources — tutorials, documentation or training — to build a foundation. I then practise with real tasks as quickly as possible, since I learn most effectively by doing. I also proactively ask colleagues or supervisors for feedback so I can correct my approach early. During my placement, I used this approach when learning a new clinical system and was able to use it independently within three days.",
  },
  {
    q: "What qualities do you think Australian employers most value in graduate employees?",
    guidance: "Show awareness of the Australian workplace context. Back up your answer with evidence from your own experience or research.",
    type: "General Graduate", difficulty: "Intermediate",
    sampleAnswer: "From my research and experience, Australian employers consistently value communication, teamwork, initiative and the ability to learn quickly. Employers often emphasise cultural fit and a positive attitude alongside technical capability, particularly at the graduate level when domain expertise is still developing. I have deliberately developed these qualities through group projects, part-time work and volunteering, and I understand that as an international student I may need to invest additional effort in understanding Australian workplace norms and professional expectations.",
  },
  {
    q: "Describe a time you received critical feedback. How did you respond?",
    guidance: "Focus on how you received the feedback, what you did with it, and what you learned.",
    type: "General Graduate", difficulty: "Intermediate",
    sampleAnswer: "During my second year, a lecturer gave me detailed written feedback indicating that my essay arguments were too general and lacked supporting evidence. My initial reaction was disappointment, but I reflected on the comments carefully, revisited the marking criteria and rewrote a substantial section before the final submission was due. I also attended a writing workshop offered by the university. My mark improved significantly in the following assessment. I now treat critical feedback as one of the most useful tools for improvement.",
  },
  {
    q: "What do you consider the most significant challenges facing graduates entering your industry in Australia right now?",
    guidance: "Demonstrate industry awareness. Show you have thought carefully about the environment you are entering.",
    type: "General Graduate", difficulty: "Advanced",
    sampleAnswer: "From my research, graduates entering the technology sector in Australia face a competitive market in which employers increasingly expect practical skills alongside academic qualifications. There is also a growing emphasis on AI literacy, which requires graduates to continuously upskill. For international graduates specifically, building professional networks and demonstrating Australian workplace readiness can be additional challenges. I have been proactive about addressing this by completing industry certifications, attending professional events, and seeking out Australian internship and placement opportunities.",
  },
  {
    q: "How would you demonstrate value during your first three months in a graduate role?",
    guidance: "Be specific. Describe actions you would take, not just intentions.",
    type: "General Graduate", difficulty: "Advanced",
    sampleAnswer: "In the first three months, I would focus on three things. First, listening and learning — I would take detailed notes, ask considered questions and seek to understand the team's processes and priorities before suggesting changes. Second, I would identify a small, tangible contribution I could make and deliver it reliably and on time to demonstrate I can follow through. Third, I would actively build relationships with colleagues and ask for feedback regularly so I can adjust my approach quickly. I would treat the first three months as an extended induction rather than a performance period.",
  },
  {
    q: "Tell me about a time you showed leadership potential, even without a formal leadership role.",
    guidance: "Leadership is about influence, not authority. Focus on initiative, communication and impact.",
    type: "General Graduate", difficulty: "Advanced",
    sampleAnswer: "During a group capstone project, our team was struggling with direction after a key member became unavailable mid-project. Without being formally assigned the leadership role, I called a team meeting, helped restructure our approach, reallocated tasks, and established a weekly check-in to maintain momentum. I also acted as the primary contact with our supervisor. The project was completed to a high standard. Several team members said the reorganisation made a significant difference to the outcome.",
  },
];

const ROLE_SPECIFIC_BANKS: Record<string, IQ[]> = {
  software: [
    {
      q: "How would you approach debugging an application that is producing unexpected results?",
      guidance: "Describe a systematic process. Show that you think methodically rather than guessing.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I would first try to reproduce the issue consistently and note the exact conditions under which it occurs. I would then review relevant logs, inputs and any recent code changes that might have introduced the problem. I would isolate individual components to narrow down the cause, add logging or use a debugger to inspect state at key points, and once I identified the problem, implement and test the fix carefully to ensure it did not introduce new issues elsewhere.",
    },
    {
      q: "What version control practices have you used in your university projects?",
      guidance: "Be specific about the tools and workflows you have used. Mention branching, pull requests or any team conventions.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "In my university projects I have used Git and GitHub for version control. I worked with feature branches to isolate changes, wrote descriptive commit messages, and used pull requests for team code review before merging to the main branch. I also learned to resolve merge conflicts and to use git log to trace the history of changes. I understand the importance of version control for maintaining code quality and team coordination in a professional environment.",
    },
    {
      q: "Explain the difference between a compiled and an interpreted programming language with an example of each.",
      guidance: "Keep the explanation clear and accurate. You do not need to go into low-level detail.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "A compiled language converts source code into machine code before execution. The compiler processes the entire program and produces an executable file, as in Java or C++. An interpreted language executes source code line by line at runtime, as Python does. Compiled languages tend to run faster because the translation has already occurred, while interpreted languages are often more flexible and easier to test interactively. Many modern languages combine elements of both approaches.",
    },
    {
      q: "How would you design a simple REST API for a task management application?",
      guidance: "Walk through your reasoning. Consider endpoints, HTTP methods, and data formats.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would start by identifying the core resources: tasks, users and potentially projects. For tasks I would design standard CRUD endpoints — GET /tasks to list all tasks, GET /tasks/{id} to retrieve a specific task, POST /tasks to create one, PUT /tasks/{id} to update it, and DELETE /tasks/{id} to remove it. I would use JSON for request and response bodies, include appropriate HTTP status codes, and think about authentication using a token-based approach. I would also consider filtering and pagination for the list endpoint if the data volume is significant.",
    },
    {
      q: "Describe how you would approach reviewing a pull request from a colleague.",
      guidance: "Show that code review is about quality and collaboration, not criticism. Mention what you look for.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would start by understanding the purpose of the change from the PR description and any linked issue. I would then read through the code to check that the logic is correct and handles edge cases, the code is readable and follows team conventions, tests are included and meaningful, and there are no obvious security or performance concerns. I would write comments that are specific, constructive and respectful — asking questions where I am unsure rather than assuming error. I would approve changes I am confident in and request changes where genuine issues exist.",
    },
    {
      q: "What steps would you take to improve the performance of a slow-running web application?",
      guidance: "Demonstrate that you measure before optimising. Walk through a structured approach.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would begin by measuring — using browser developer tools, APM tools or server-side profiling to identify where the bottleneck actually is, rather than guessing. Common areas to investigate include slow database queries, unnecessary network requests, large unoptimised assets and blocking JavaScript. Once I identified the primary cause, I would implement a targeted change, measure again to confirm improvement, and repeat. I would avoid premature optimisation and focus on changes with the greatest measurable impact first.",
    },
    {
      q: "How would you architect a system that needs to scale to handle significantly increased user load?",
      guidance: "Demonstrate awareness of scalability principles. You do not need to design a production system — focus on reasoning.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would start by understanding the expected load patterns — whether scaling needs are predictable or variable — and identify the bottlenecks in the current architecture. For horizontal scaling, I would consider load balancing across multiple application instances and stateless design so any instance can handle any request. I would evaluate caching strategies to reduce database load, consider database read replicas or sharding if the data layer is the constraint, and use asynchronous processing for non-time-critical tasks. I would also design for observability from the beginning so that performance issues can be detected quickly in production.",
    },
    {
      q: "How would you introduce automated testing to a codebase that currently has none?",
      guidance: "A pragmatic approach is valued here. Show that you understand tradeoffs and would prioritise effectively.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would avoid attempting to test everything immediately, as that is not sustainable. Instead I would start by writing tests for the highest-risk, most frequently changed parts of the codebase — core business logic, critical data transformations and key API endpoints. I would introduce a testing framework and establish a pattern the team can follow consistently. I would add tests incrementally alongside new features and bug fixes, using a principle of 'leave it better than you found it'. I would also advocate for integrating tests into the CI pipeline so they run automatically on every commit.",
    },
    {
      q: "How would you balance technical debt against new feature development in an Agile team?",
      guidance: "Show that you understand both business and technical perspectives. There is no single right answer — reasoning matters.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "Technical debt and new feature delivery are both legitimate priorities, and managing the balance requires transparency. I would advocate for making technical debt visible in the backlog rather than treating it as invisible background work, so the team and product owner can make informed prioritisation decisions. A common approach is to allocate a consistent portion of each sprint — often around 20 percent — to technical debt reduction. I would also argue that addressing debt that directly affects delivery speed should be treated as enabling future feature work, not competing with it.",
    },
  ],
  data: [
    {
      q: "How would you approach cleaning a dataset that contains missing values?",
      guidance: "Show a methodical approach. Consider why values might be missing and what the appropriate response is.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I would first explore the data to understand the extent and pattern of missing values — whether they are missing at random or whether there is a systematic reason. Depending on the context, I would consider removing rows where the missing values are few and the dataset is large enough, imputing values using an appropriate method such as the mean, median or mode, or flagging the missing values as a category in their own right. I would document every decision I make and validate that my approach does not introduce bias into the analysis.",
    },
    {
      q: "Describe how you have used data visualisation to communicate findings.",
      guidance: "Be specific about the tool, the audience and the choices you made.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "During my university capstone, I used Tableau to visualise seasonal sales trends from a retail dataset. The audience included academic staff and a simulated business client, so I chose clear bar and line charts rather than more complex visualisations. I used colour deliberately to highlight the key finding — a consistent dip in sales during March — and built a dashboard that allowed the audience to filter by product category. The presentation received positive feedback for its clarity.",
    },
    {
      q: "What is the difference between a mean and a median, and when would you use each?",
      guidance: "Keep the explanation practical and provide a real-world example.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "The mean is the arithmetic average of a dataset, while the median is the middle value when the data is sorted. The mean is sensitive to outliers — if a dataset of household incomes includes a very high earner, the mean will be pulled upward and may not represent the typical household. The median is more robust in that situation. I would use the mean for roughly symmetric distributions without extreme outliers and the median when the data is skewed or contains outliers that would distort the average.",
    },
    {
      q: "How would you identify and handle outliers in a dataset?",
      guidance: "Show awareness of different detection methods and explain that outlier handling depends on context.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would first visualise the data using box plots or scatter plots to get an initial sense of the distribution. I would then use statistical methods such as the interquartile range or z-scores to identify values that fall significantly outside the expected range. Before deciding how to handle them, I would investigate why they exist — a genuine extreme value, a data entry error or a sensor fault all require different responses. I would document my decision and, if removing or adjusting outliers, test whether it materially changes the analysis conclusion.",
    },
    {
      q: "Walk me through a SQL query you have written for a meaningful analysis task.",
      guidance: "Be specific. Describe the data, the question you were answering, and the query structure.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "In my university project I analysed a retail sales database. To identify the top-performing product categories by total revenue for each quarter, I wrote a query that joined the sales and product tables on product ID, used a GROUP BY on category and quarter, and aggregated total sales using SUM. I then used ORDER BY and LIMIT to surface the top results. I also used a WHERE clause to filter out cancelled transactions. The result was a clean summary table I imported into Tableau for visualisation.",
    },
    {
      q: "Describe your approach to validating an analysis before presenting results to stakeholders.",
      guidance: "Validation is about accuracy and trustworthiness. Show a structured approach.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "Before presenting, I cross-check my results against known reference points — for example, verifying that total figures match source records. I review my code or query logic for errors, check that filters are applied correctly and that aggregations make sense. I also sense-check results intuitively — if a metric seems unexpectedly high or low, I investigate before proceeding. Where possible I have a colleague review the analysis. I also ensure that the scope of my conclusions matches the data I actually have and avoid overstating certainty.",
    },
    {
      q: "How would you design a dashboard to help a non-technical stakeholder make a business decision?",
      guidance: "Audience awareness and clarity are central. Show that you think about communication, not just visualisation.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would start by having a conversation with the stakeholder to understand the specific decision they need to make and what information is most critical. I would then select two or three key metrics that directly inform that decision, rather than showing everything available. I would use simple, familiar chart types, clear labels, and consistent colour use. I would avoid jargon and technical formatting. The dashboard would include a brief written summary of the key finding and a recommended action, because not every stakeholder will interpret a chart the same way. I would review the draft with the stakeholder before finalising.",
    },
    {
      q: "How would you approach a situation where you suspect the data you have been given is incomplete or biased?",
      guidance: "Show ethical awareness and a practical response. Raising concerns clearly is important.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would document my concerns clearly and raise them with my supervisor or the data owner before proceeding. I would describe the specific indicators that suggest incompleteness or bias — for example, a demographic group that appears underrepresented, or a time period with suspiciously low volume. I would ask for additional context about how the data was collected. If the issue cannot be resolved but the analysis must proceed, I would explicitly state the limitation in my findings and qualify any conclusions accordingly. Presenting misleading analysis because the underlying data is flawed causes more harm than acknowledging the limitation.",
    },
    {
      q: "How would you approach a situation where a data analysis leads to a finding that contradicts a stakeholder's expectations?",
      guidance: "Focus on how you would handle the communication professionally and credibly.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "First, I would validate my analysis thoroughly to make sure the finding is correct and I have not made an error. Once confident, I would present the finding transparently, clearly explaining the data, the methodology and the limitations. I would acknowledge the stakeholder's expectation, explore whether there is a reason for the discrepancy, and invite them to raise any concerns about the methodology. I would not adjust the finding to match the expectation, but I would be open to re-examining the analysis if specific, substantive concerns were raised. Credibility as an analyst depends on presenting findings accurately.",
    },
  ],
  nursing: [
    {
      q: "Why did you choose nursing, and what qualities do you bring to patient care?",
      guidance: "Be genuine. Connect your personal motivation to the practical qualities you have developed.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I chose nursing because I wanted a career that combines scientific knowledge with direct, meaningful impact on people's lives. During my placements I found genuine satisfaction in supporting patients through difficult periods and in the teamwork of the clinical environment. I bring compassion, attention to detail and a calm, professional manner under pressure. I have also developed strong clinical observation skills through my placements, and I take documentation and handover accuracy seriously.",
    },
    {
      q: "Describe your clinical placement experience and the most significant thing you learned from it.",
      guidance: "Be specific about the setting and the learning. Show that you reflected on your experience.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "My primary placement was at a metropolitan medical-surgical ward. The most significant thing I learned was the importance of clear clinical handover. Early in the placement I observed an instance where an incomplete handover led to a brief delay in patient care. From that point I was extremely deliberate about the completeness and accuracy of my own handovers, using a structured format every time. I also learned how to prioritise effectively across multiple patients, which is a skill I continue to develop.",
    },
    {
      q: "How do you prioritise tasks when caring for multiple patients simultaneously?",
      guidance: "Show clinical reasoning and structured thinking. Describe a specific approach rather than a general statement.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "At the start of each shift I review all patient notes and identify anyone with time-sensitive clinical needs — vital signs monitoring, medication administration windows, or recent changes in condition. I then work through observations and interventions in order of clinical priority, keeping time-sensitive tasks at the top of my list. I use brief mental checks throughout the shift to make sure nothing has been missed as patient conditions change. I also communicate with my RN supervisor when I am uncertain about priority or need to escalate a concern.",
    },
    {
      q: "Tell me about a situation during placement where you had to escalate a concern about a patient's condition.",
      guidance: "Describe the specific signs you noticed, how you communicated the concern, and what happened.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "During my acute care placement, I observed a patient who had become increasingly restless and whose oxygen saturation had dropped from their baseline over about 30 minutes. The change was subtle but I was concerned. I alerted my supervising RN immediately, clearly describing the observations and the timeframe. The RN assessed the patient, contacted the medical officer, and supplemental oxygen was commenced. The patient's condition stabilised. The experience reinforced for me that acting on clinical instinct and escalating promptly is part of safe nursing practice.",
    },
    {
      q: "How do you approach communicating with patients who are anxious or distressed?",
      guidance: "Show therapeutic communication skills and person-centred care. Be specific about techniques.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I start by acknowledging the person's feelings rather than immediately trying to reassure them or move to a task. I introduce myself clearly, use a calm and unhurried tone, and give the person time to express what is concerning them. I use plain language rather than clinical terminology, check for understanding, and involve them in decisions about their care wherever possible. I also pay attention to non-verbal cues — if someone appears tense, I adjust my approach. On placement I found that simple acknowledgment — 'I can hear that you are worried' — often reduced distress more effectively than explanations.",
    },
    {
      q: "Describe how you ensure accuracy in clinical documentation.",
      guidance: "Describe specific habits and practices. Mention why accuracy in documentation matters.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I document observations and interventions as promptly as possible rather than relying on memory, because recall accuracy decreases over a shift. I use objective, specific language rather than vague terms — for example, 'Patient reports pain at 7 out of 10 on movement' rather than 'patient in pain'. I cross-check medication administration against the medication chart immediately before and after administration. I also review my documentation at the end of the shift to identify any gaps before handing over. I understand that the medical record is a legal document and a critical communication tool, and I treat it accordingly.",
    },
    {
      q: "How would you manage a situation where a patient or family member refuses recommended treatment?",
      guidance: "Show understanding of informed consent, patient rights and professional obligations.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would first ensure the patient and family have clear, accurate information about the recommended treatment, its purpose and the potential consequences of refusal, using plain language. I would listen carefully to their concerns without being dismissive. If the patient has capacity to make the decision, I would respect their right to refuse — my role is to ensure the decision is fully informed, not to override it. I would document the conversation and the outcome accurately, inform my supervising nurse and the treating team, and ensure the patient continues to receive all care they do accept. I would also ask whether there is anything we could do differently to address their concerns.",
    },
    {
      q: "How would you respond if you observed a colleague making what appeared to be a clinical error?",
      guidance: "This tests professional responsibility and communication. Focus on patient safety and respectful escalation.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "My primary responsibility is patient safety. If I observed a potential error, I would intervene calmly and immediately if it was safe to do so — for example, clarifying a medication dose before it was administered. I would avoid public confrontation and speak with my colleague privately and respectfully, describing what I observed and giving them the opportunity to explain. If the error had already occurred or if I was uncertain, I would escalate to my supervising nurse promptly and document my observations accurately. I would not ignore a concern because the colleague was more senior — patient safety takes precedence.",
    },
    {
      q: "How do you maintain professional boundaries while providing compassionate, person-centred care?",
      guidance: "Show understanding of the therapeutic relationship and why boundaries protect both patient and nurse.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "Professional boundaries allow me to provide genuine care while maintaining the objectivity and reliability that patients need. In practice, this means being warm and present with patients without becoming personally over-invested, maintaining consistent behaviour regardless of whether I like or relate to a patient, and being careful about the type of personal information I share. If a patient or family member attempts to shift the relationship outside professional limits, I would respond with warmth but redirect clearly. I would seek supervision or debrief support from my nurse manager if I found a particular therapeutic relationship difficult to manage. Maintaining boundaries is not about being cold — it is about being consistently trustworthy.",
    },
  ],
  marketing: [
    {
      q: "Which digital marketing channels have you worked with, and what have you learned from them?",
      guidance: "Be specific about platforms and what you observed about their different audiences or dynamics.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "During my studies and volunteer work, I have worked primarily with Instagram, LinkedIn and Facebook. I found that Instagram drives strong visual engagement and suits short-form creative content, while LinkedIn is more effective for professional audiences and thought-leadership content. Facebook has a broader demographic but requires consistent posting and community management to maintain engagement. I managed the Instagram account for my university student association and grew the following from approximately 400 to 1,100 over twelve months through consistent posting and audience-targeted content.",
    },
    {
      q: "Describe a marketing project or campaign you worked on during your studies.",
      guidance: "Be specific about your role, the audience, the approach and the outcome.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "My capstone project involved developing a comprehensive digital marketing strategy for a fictional retail brand. I conducted a target audience analysis, developed a channel strategy prioritising Instagram and email marketing, created a content calendar and outlined projected ROI. I presented the strategy to a panel of industry professionals and received feedback that the audience segmentation was particularly strong. The project received a distinction and I found the process of connecting consumer insight to channel decisions the most valuable aspect of the learning.",
    },
    {
      q: "How would you measure the success of a social media campaign?",
      guidance: "Show that you know the difference between vanity metrics and meaningful performance indicators.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "It depends on the campaign objective. For a brand awareness campaign I would focus on reach, impressions and share of voice. For engagement campaigns I would track likes, comments, shares and saves as a proportion of reach. For conversion-focused campaigns I would measure click-through rates, website traffic from the channel and ultimately conversions or sales attributed to the campaign. I would define the primary KPI before the campaign launches and compare results against a benchmark — either historical performance or an industry standard. Follower count alone is rarely a meaningful success metric.",
    },
    {
      q: "How would you develop a content strategy for a brand targeting young Australian consumers?",
      guidance: "Show audience insight, platform selection rationale and content planning thinking.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would start with audience research — understanding what content this demographic consumes, on which platforms, and what values or interests they respond to. For young Australians, platforms such as Instagram, TikTok and YouTube are typically most relevant. I would define a consistent brand voice and content pillars — for example, entertainment, education and community — and create a content calendar that balances these. I would plan for a mix of owned content, user-generated content and collaborations with relevant creators. I would also build in a regular review cycle to assess what content performs and adjust the strategy accordingly.",
    },
    {
      q: "What metrics would you use to evaluate an email marketing campaign?",
      guidance: "Show knowledge of email-specific metrics and their meaning.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "The primary metrics I would track are open rate, click-through rate, conversion rate, unsubscribe rate and bounce rate. Open rate indicates whether the subject line and send time are effective. Click-through rate shows whether the email content and call-to-action are compelling. Conversion rate measures whether recipients completed the desired action. A rising unsubscribe rate would signal a problem with content relevance or frequency. I would benchmark these against industry averages and our own historical performance to determine whether the campaign was successful.",
    },
    {
      q: "Describe how you would analyse competitor marketing activity to inform your own planning.",
      guidance: "Show analytical thinking and awareness of ethical competitive intelligence approaches.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I would start by auditing competitor social media channels, websites and email communications to understand their messaging, tone, content themes and posting frequency. I would use tools such as Meta Ad Library to review any paid social campaigns they are running. I would also note the customer reviews and comments they receive to understand audience sentiment. From this analysis I would identify gaps — topics or audiences they are not addressing — as well as approaches that appear to resonate with their audience. The goal is not to imitate but to inform our own positioning and identify opportunities.",
    },
    {
      q: "How would you approach launching a new product in a competitive Australian market with a limited budget?",
      guidance: "Show strategic prioritisation, creativity and understanding of the Australian market.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "With a limited budget I would prioritise precision over reach. I would start by defining a very specific target audience and understanding where they spend their time and what influences their decisions. I would focus resources on one or two channels rather than spreading thinly across many. I would lean into earned media — PR, community partnerships and user-generated content — rather than paid advertising. I would consider a phased launch starting in one geographic market to test messaging before scaling. I would also establish a referral or word-of-mouth mechanism from day one, since peer recommendation is particularly influential among Australian consumers.",
    },
    {
      q: "Describe how you would use customer data ethically to personalise a marketing campaign.",
      guidance: "Show understanding of privacy obligations, the Australian Privacy Principles, and responsible data use.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "Ethical personalisation starts with ensuring that data collection is transparent and consented to. Under the Australian Privacy Principles, individuals must be informed about how their data is collected and used, and that information must only be used for the purpose it was collected. In practice, I would use behavioural data — such as browsing history or past purchases — to tailor content and offers without using sensitive personal attributes in ways the customer would not expect or find intrusive. I would ensure the personalisation adds value to the customer rather than feeling surveillance-like, and I would provide clear options to manage or opt out of personalised communications.",
    },
    {
      q: "How would you manage a campaign that is significantly underperforming against its targets?",
      guidance: "Show analytical thinking, communication skills and decision-making under pressure.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "My first step would be to diagnose the cause rather than immediately changing tactics. I would review performance data at each stage of the funnel to identify where the drop-off is occurring — whether it is a reach problem, an engagement problem or a conversion problem — since each requires a different response. I would check whether external factors such as a competitor activity or a news cycle might be affecting performance. Once I understood the cause, I would develop and prioritise a set of specific changes, implement the most impactful first, and measure the effect. I would also communicate transparently with the stakeholder, explaining what the data shows and what actions I am taking.",
    },
  ],
  general: [
    {
      q: "What does this role involve, and why do you believe you are a suitable candidate?",
      guidance: "Demonstrate role understanding. Link your skills and experience directly to the requirements.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "From the role description, this position involves coordinating cross-functional activities, managing stakeholder communication and contributing to project planning and delivery. I believe I am a suitable candidate because my studies have developed strong analytical and organisational skills, and I have demonstrated these through managing complex group projects and working in fast-paced part-time roles. I am also a clear communicator, which I understand is central to this type of role.",
    },
    {
      q: "Describe your approach to planning and organising a complex task or project.",
      guidance: "Walk through a specific approach or example. Show structure, adaptability and follow-through.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I start by clarifying the goal and identifying all the key milestones and dependencies. I then break the work into specific tasks, estimate the time required for each and assign or schedule them. I use a tool — whether a shared document, a project board or a calendar — to track progress and flag when something is falling behind. I build in buffer time for unexpected issues and check in regularly rather than waiting until a deadline is close. During my studies I used this approach for all major group assessments and it consistently helped the team stay on track.",
    },
    {
      q: "How do you typically handle workplace conflict or disagreement?",
      guidance: "Show that you approach conflict constructively. Focus on communication and resolution.",
      type: "Role-Specific", difficulty: "Beginner",
      sampleAnswer: "I try to address disagreements directly and calmly rather than allowing them to continue unresolved. My first step is to understand the other person's perspective fully before explaining my own. I find that most disagreements stem from a difference in priorities or assumptions rather than a genuine conflict of interest, and once those are visible, a workable solution is usually possible. If a disagreement involves a group, I would suggest a brief structured conversation to surface the different views and agree on a way forward. I would escalate to a supervisor only if direct discussion had not resolved the issue.",
    },
    {
      q: "Describe a situation where you worked with people from different professional backgrounds to achieve a shared goal.",
      guidance: "Show awareness of collaboration across disciplines. Focus on communication and mutual understanding.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "During a university interdisciplinary project, my team included students from business, information technology and design. Our challenge was that each group used different terminology and had different assumptions about the project scope. I took the initiative to schedule a shared session at the start where we defined our goals and agreed on how decisions would be made. I also acted as an informal translator between the technical and business-focused members throughout the project. The final outcome was well-integrated, and all team members felt their perspective had been respected.",
    },
    {
      q: "How do you stay current with developments in your chosen industry?",
      guidance: "Show genuine professional curiosity. Be specific about what you read, follow or attend.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I follow several industry publications and newsletters relevant to my field, and I attend professional events and webinars when they are available. I am a member of a student professional association and have used that network to learn about industry trends from practitioners. I also look for opportunities to apply current industry knowledge in my university projects rather than treating academic and professional learning as separate. I am aware that staying current is an ongoing professional responsibility, not something that ends at graduation.",
    },
    {
      q: "What strategies do you use to manage workload when facing tight deadlines?",
      guidance: "Show practical strategies, not just general statements about staying calm.",
      type: "Role-Specific", difficulty: "Intermediate",
      sampleAnswer: "I start by listing every outstanding task and the deadline for each, then identify which are fixed and which have some flexibility. I prioritise ruthlessly — focusing first on tasks that are both high-impact and time-critical — and I communicate with stakeholders early if something is at risk of being delayed rather than waiting until it is too late to adjust. I batch similar tasks to reduce context-switching and protect focused work time. If I am genuinely overwhelmed, I ask for support or renegotiate scope rather than letting quality suffer silently.",
    },
    {
      q: "How would you approach identifying and mitigating risks in a project or initiative you are responsible for?",
      guidance: "Show structured thinking. Demonstrate that you consider both likelihood and impact.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would begin by bringing the key stakeholders and team members together to identify risks systematically — covering dependencies, resourcing, technical assumptions and external factors. For each risk I would assess the likelihood and the potential impact if it occurred, and prioritise accordingly. For high-priority risks I would define specific mitigation actions and assign ownership. I would document the risk register and review it at regular intervals throughout the project, updating it as conditions change. I would also distinguish between risks I can mitigate proactively and uncertainties I need to monitor and respond to.",
    },
    {
      q: "Describe a time you had to make a decision with incomplete information. How did you approach it?",
      guidance: "Show that you can move forward under uncertainty without being reckless.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "During a university project, our team had to choose a technical architecture without being able to fully scope the requirements, because the client was still defining their needs. I identified the two or three assumptions that most affected the decision, assessed the cost of getting them wrong, and chose the architecture that was most reversible if our assumptions proved incorrect. I documented the assumptions and the reasoning explicitly so the team could revisit them if conditions changed. The approach meant we could move forward productively while staying adaptive.",
    },
    {
      q: "How would you build effective working relationships with senior stakeholders you are meeting for the first time?",
      guidance: "Show professional maturity, listening skills and awareness of stakeholder management.",
      type: "Role-Specific", difficulty: "Advanced",
      sampleAnswer: "I would prepare thoroughly before the first meeting — understanding their role, priorities and what they care about in the context of the work we share. In the meeting itself I would listen more than I speak, ask considered questions and avoid overselling my own capabilities. I would focus on understanding what success looks like from their perspective and how I can contribute to it. I would follow through on any commitment I made in that first conversation quickly and reliably, since trust is built through consistent follow-through more than initial impression. I would also remain mindful that senior stakeholders have limited time and calibrate my communications accordingly.",
    },
  ],
};

const BEHAVIOURAL_FEEDBACK = [
  {
    strength: "A strong behavioural answer usually gives clear context and explains your individual role in the situation.",
    improvement: "Make sure the outcome of your actions is clearly explained rather than focusing only on what happened.",
    suggestion: "Use one or two sentences to explain the result, what was achieved, and what you specifically contributed.",
    structure: "Use the STAR structure: Situation, Task, Action and Result. Give particular attention to your Action and Result.",
    clarity: "Keep your example specific and concise, and focus on details that are relevant to the question.",
  },
  {
    strength: "Effective behavioural answers clearly distinguish your own actions from the work of the wider team.",
    improvement: "Include a specific outcome or lesson learned so the example demonstrates the impact of your actions.",
    suggestion: "Where appropriate, include a concrete result, such as an improvement, completed task, positive outcome or lesson learned.",
    structure: "Check that your response contains all four STAR elements, especially a clear Result.",
    clarity: "Use a professional tone and specific examples rather than broad or general statements.",
  },
  {
    strength: "A strong answer can demonstrate self-awareness by explaining both what happened and what you learned from the experience.",
    improvement: "Clearly separate the situation from the specific task or responsibility you personally had.",
    suggestion: "After introducing the situation, briefly state your responsibility before explaining the actions you took.",
    structure: "Keep the Situation concise, identify the Task clearly, then focus most of the response on your Action and Result.",
    clarity: "Use clear, direct language and finish with a concise explanation of the outcome or learning.",
  },
];

const GRADUATE_FEEDBACK = [
  {
    strength: "A strong graduate interview answer usually communicates genuine motivation for the role while maintaining a professional tone.",
    improvement: "Make an explicit connection between your relevant skills and the requirements of the role.",
    suggestion: "Identify one or two capabilities, support them with a brief example, and explain how they relate to the role.",
    structure: "For motivation questions, consider explaining why the role interests you, what relevant strengths you bring, and how you could contribute.",
    clarity: "Use clear and confident language. Avoid repeatedly beginning statements with phrases such as 'I think' or 'I believe'.",
  },
  {
    strength: "Effective graduate answers demonstrate awareness of your current capabilities, development and career direction.",
    improvement: "Support statements about your strengths or goals with specific evidence from your studies, projects, work or other relevant experience.",
    suggestion: "For each important strength or career goal, include a brief concrete example that demonstrates why it is credible.",
    structure: "Organise the answer so that your current capabilities connect logically with your future goals and the opportunity you are discussing.",
    clarity: "Keep statements specific and relevant. Concrete examples are generally more persuasive than broad claims.",
  },
  {
    strength: "A strong graduate answer can demonstrate professional curiosity and awareness of the workplace or industry.",
    improvement: "Clearly explain how your studies, projects or experience are relevant to the specific role.",
    suggestion: "After describing an experience, explicitly connect it to a skill, responsibility or capability that would be useful in the role.",
    structure: "A useful structure is: why the role interests you, what relevant capabilities you bring, and how you could contribute.",
    clarity: "Use direct professional language and minimise filler expressions such as 'basically' or 'kind of'.",
  },
];

const ROLE_SPECIFIC_FEEDBACK = [
  {
    strength: "A strong role-specific answer demonstrates structured thinking and explains a clear approach to the problem or task.",
    improvement: "Where possible, connect your approach to a real example from your studies, projects, work or other relevant experience.",
    suggestion: "Use a specific project or situation to demonstrate how you applied the approach in practice.",
    structure: "Explain your approach clearly, then support it with a practical example and the outcome where relevant.",
    clarity: "Use appropriate technical language, but make sure your explanation can also be understood by non-technical interviewers.",
  },
  {
    strength: "Effective role-specific answers demonstrate methodical thinking and awareness of relevant options or trade-offs.",
    improvement: "Include the outcome or impact of applying your approach rather than describing only the process.",
    suggestion: "Describe a situation where you used the approach, the actions you took, and what resulted from those actions.",
    structure: "Explain the method first, then connect it to an outcome to demonstrate its practical value.",
    clarity: "Keep the explanation professional and structured, and briefly explain specialised technical terms when appropriate.",
  },
  {
    strength: "A strong technical or role-specific answer communicates your reasoning clearly and demonstrates a logical problem-solving process.",
    improvement: "Demonstrate technical knowledge with specific evidence rather than relying only on an abstract explanation.",
    suggestion: "Where relevant, mention a specific tool, technique, technology or decision from a real project or experience.",
    structure: "Consider stating the key principle or approach first, then explain the steps and provide supporting evidence.",
    clarity: "Keep the answer concrete and relevant. Practical examples can make technical reasoning easier for an interviewer to understand.",
  },
];


function detectRoleForInterview(role: string, industry: string): string {
  const r = (role + " " + industry).toLowerCase();
  if (r.includes("nurs") || r.includes("midwi") || r.includes("clinical") || r.includes("healthcare") || r.includes("allied health")) return "nursing";
  if (r.includes("market") || r.includes("brand") || r.includes("digital") || r.includes("communications") || r.includes("content")) return "marketing";
  if (r.includes("data analyst") || r.includes("data science") || r.includes("business intelligence") || r.includes("analytics")) return "data";
  if (r.includes("software") || r.includes("developer") || r.includes("engineer") || r.includes("full stack") || r.includes("backend") || r.includes("frontend") || r.includes("devops") || r.includes("programmer")) return "software";
  return "general";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(arr: T[], difficulty: string, n: number): T[] {
  const filtered = (arr as IQ[]).filter((q) => q.difficulty === difficulty);
  const pool = filtered.length >= n ? filtered : arr as IQ[];
  const shuffled = shuffle(pool);
  const result: T[] = [];
  for (let i = 0; i < n; i++) result.push(shuffled[i % shuffled.length] as T);
  return result;
}

function buildSessionQuestions(type: string, role: string, industry: string, difficulty: string, count: number): IQ[] {
  const roleKey = detectRoleForInterview(role, industry);
  const roleBank = ROLE_SPECIFIC_BANKS[roleKey] ?? ROLE_SPECIFIC_BANKS.general;

  if (type === "Behavioural") return pickN(BEHAVIOURAL, difficulty, count);
  if (type === "General graduate interview") return pickN(GRADUATE, difficulty, count);
  if (type === "Role-specific") return pickN(roleBank, difficulty, count);

  // Mixed practice — interleave evenly across all three types
  const perType = Math.ceil(count / 3);
  const b = pickN(BEHAVIOURAL, difficulty, perType);
  const g = pickN(GRADUATE, difficulty, perType);
  const r = pickN(roleBank, difficulty, perType);
  const combined: IQ[] = [];
  for (let i = 0; i < Math.max(b.length, g.length, r.length); i++) {
    if (b[i]) combined.push(b[i]);
    if (g[i]) combined.push(g[i]);
    if (r[i]) combined.push(r[i]);
  }
  return combined.slice(0, count);
}

function getFeedbackForQuestion(q: IQ, idx: number) {
  if (q.type === "Behavioural") return BEHAVIOURAL_FEEDBACK[idx % BEHAVIOURAL_FEEDBACK.length];
  if (q.type === "General Graduate") return GRADUATE_FEEDBACK[idx % GRADUATE_FEEDBACK.length];
  return ROLE_SPECIFIC_FEEDBACK[idx % ROLE_SPECIFIC_FEEDBACK.length];
}

/* ─────────────────────────────────────────
   Shared UI primitives
───────────────────────────────────────── */
const IC = "indigo";
const ACCENT = "#4f46e5";
const ACCENT_LIGHT = "#eef2ff";
const ACCENT_MED = "#6366f1";

function Btn({
  children, onClick, variant = "primary", size = "md", disabled = false, full = false,
}: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg"; disabled?: boolean; full?: boolean;
}) {
  const base = `inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${full ? "w-full" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;
  const sz = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-sm px-6 py-3" }[size];
  const var_ = {
    primary: `bg-[${ACCENT}] text-white hover:bg-[${ACCENT_MED}] focus:ring-[${ACCENT}]`,
    secondary: "bg-white text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f8fafc] focus:ring-[#94a3b8]",
    ghost: "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] focus:ring-[#94a3b8]",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  }[variant];
  return (
    <button type="button" disabled={disabled} className={`${base} ${sz} ${var_}`} onClick={onClick}>
      {children}
    </button>
  );
}


function AIDisclaimer({ text = "AI-generated feedback may contain inaccuracies. Review recommendations before making changes and seek professional career advice when appropriate." }: { text?: string }) {
  return (
    <div role="status" className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
      <span className="text-amber-600 flex-shrink-0 mt-0.5">⚠</span>
      <p className="text-xs text-amber-800 leading-relaxed">{text}</p>
    </div>
  );
}

function PrivacyNotice({ text }: { text: string }) {
  return (
    <div role="status" className="flex items-start gap-2.5 px-4 py-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg">
      <span className="text-[#0ea5e9] flex-shrink-0 mt-0.5">🔒</span>
      <p className="text-xs text-[#0369a1] leading-relaxed">{text}</p>
    </div>
  );
}

function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-[#64748b]">{label}</span>
        <span className="text-xs font-medium text-[#0f172a]">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[#4f46e5] transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${done ? "bg-[#4f46e5] border-[#4f46e5] text-white" : active ? "border-[#4f46e5] text-[#4f46e5] bg-white" : "border-[#e2e8f0] text-[#94a3b8] bg-white"}`}>
      {done ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : n}
    </div>
  );
}

/* ─────────────────────────────────────────
   Sidebar navigation
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   SCREEN AUTH — Sign in / Sign up
───────────────────────────────────────── */

function AuthScreen({ onSuccess }: { onSuccess: (userId: number, name: string, email: string, isNew: boolean) => void }) {
 const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
/* Forgot password state */
const [forgotEmail, setForgotEmail] = useState("");
const [forgotError, setForgotError] = useState("");
const [forgotSuccess, setForgotSuccess] = useState("");
const [forgotLoading, setForgotLoading] = useState(false);
  /* Sign-in state */
  const [siEmail, setSiEmail]       = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siError, setSiError]       = useState("");
  const [siLoading, setSiLoading]   = useState(false);
  const [showSiPass, setShowSiPass] = useState(false);

  /* Sign-up state */
  const [suName, setSuName]           = useState("");
  const [suEmail, setSuEmail]         = useState("");
  const [suPassword, setSuPassword]   = useState("");
  const [suConfirm, setSuConfirm]     = useState("");
  const [suUni, setSuUni]             = useState("");
  const [suAgree, setSuAgree]         = useState(false);
  const [suError, setSuError] = useState("");

const [suFieldErrors, setSuFieldErrors] = useState<{
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  privacy?: string;
}>({});

const [suLoading, setSuLoading] = useState(false);
  const [showSuPass, setShowSuPass]   = useState(false);

  const UNIS = ["University of Sydney", "University of Melbourne", "UNSW Sydney", "Monash University", "University of Queensland", "University of Adelaide", "Macquarie University", "Other"];

const handleForgotPassword = async () => {
  setForgotError("");
  setForgotSuccess("");

  const email = forgotEmail.trim();

  if (!email) {
    setForgotError("Please enter your email address.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setForgotError("Please enter a valid email address.");
    return;
  }

  setForgotLoading(true);

  try {
    const response = await fetch(
      "/api/forgot-password.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setForgotError(
        data.message || "Unable to process password reset request."
      );
      return;
    }

    setForgotSuccess(
      "If this email is registered, password reset instructions have been generated. In this development version, the reset link is available to the developer."
    );
  } catch {
    setForgotError(
      "Unable to connect to the server. Please try again."
    );
  } finally {
    setForgotLoading(false);
  }
};

  const handleSignIn = async () => {
    setSiError("");

    if (!siEmail || !siPassword) {
      setSiError("Please enter your email and password.");
      return;
    }

    setSiLoading(true);

    try {
      const response = await fetch("/api/login.php", {
        method: "POST",
credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: siEmail.trim(),
          password: siPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSiError(data.message || "Email or password is incorrect.");
        return;
      }
const displayName =
  data.user.preferred_name?.trim() ||
  data.user.email.split("@")[0].split(".")[0];

onSuccess(
  data.user.user_id,
  displayName,
  data.user.email,
  false
);

    } catch (error) {
      setSiError("Unable to connect to the server. Please try again.");
    } finally {
      setSiLoading(false);
    }
  };

  const handleSignUp = async () => {
    setSuError("");
setSuFieldErrors({});

   const errors: Record<string, string> = {};
const email = suEmail.trim();

// 1. Preferred name validation
if (!suName.trim()) {
  errors.name = "Please enter your preferred name.";
} else if (suName.trim().length > 100) {
  errors.name = "Preferred name must not exceed 100 characters.";
}

// 2. Email validation
if (!email) {
  errors.email = "Please enter your email address.";
} else if (email.length > 255) {
  errors.email = "Email address must not exceed 255 characters.";
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  errors.email = "Please enter a valid email address.";
}

// 3. Password validation
if (!suPassword.trim()) {
  errors.password = "Please enter a password. Spaces alone are not allowed.";
} else if (suPassword.length < 8) {
  errors.password = "Password must be at least 8 characters.";
}

// 4. Confirm password validation
if (!suConfirm) {
  errors.confirm = "Please confirm your password.";
} else if (suPassword !== suConfirm) {
  errors.confirm = "Passwords do not match.";
}

// 5. Privacy notice validation
if (!suAgree) {
  errors.privacy = "Please accept the privacy notice to continue.";
}

// Display all validation errors together
if (Object.keys(errors).length > 0) {
  setSuFieldErrors(errors);
  return;
}

// Continue only when all fields are valid
setSuLoading(true);

    try {
      const response = await fetch("/api/register.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  preferred_name: suName.trim(),
  email: suEmail.trim(),
  password: suPassword,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        setSuError(data.message || "Unable to create account.");
        return;
      }

      onSuccess(
  data.user.user_id,
  data.user.preferred_name,
  data.user.email,
  true
);
    } catch (error) {
      setSuError("Unable to connect to the server. Please try again.");
    } finally {
      setSuLoading(false);
    }
  };

  const Logo = () => (
    <div className="mb-8 flex flex-col items-center gap-3">
      <AppLogo size="lg" />
      <p className="text-center text-xs font-medium text-slate-500">
        For international students in Australia
      </p>
    </div>
  );

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 bg-slate-50/50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-violet-200 font-sans flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Logo />

        {/* Tab toggle */}
        <div className="flex bg-white/90 border border-indigo-100 rounded-2xl p-1.5 mb-6 shadow-md shadow-indigo-100/50">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setSiError(""); setSuError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === m ? "bg-[#4f46e5] text-white shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"}`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <div className="bg-white border border-indigo-100 rounded-3xl shadow-xl shadow-indigo-200/40 overflow-hidden">
          {/* ── SIGN IN ── */}
          {mode === "signin" && (
            <div className="p-7 sm:p-9">
              <h2 className="text-lg font-semibold text-[#0f172a] mb-1">Welcome back</h2>
              <p className="text-xs text-[#64748b] mb-6">Sign in to continue your career preparation.</p>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Email address</span>
                  <input
                    type="email"
                    placeholder="you@university.edu.au"
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium text-[#0f172a]">Password</span>
                  <button
  type="button"
  onClick={() => {
    setForgotEmail(siEmail);
    setForgotError("");
    setForgotSuccess("");
    setMode("forgot");
  }}
  className="text-xs text-[#4f46e5] hover:underline"
>
  Forgot password?
</button>
                  </div>
                  <div className="relative">
                    <input
                      type={showSiPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  className={`${inputCls} pr-10`}
aria-invalid={!!suFieldErrors.password}
                    />
                    <button
                      onClick={() => setShowSiPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] text-xs"
                    >
                      {showSiPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
              </div>

              {siError && (
                <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-500 flex-shrink-0 text-xs mt-0.5">✕</span>
                  <p className="text-xs text-red-700">{siError}</p>
                </div>
              )}

              <button
                onClick={handleSignIn}
                disabled={siLoading}
                className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {siLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : "Sign in"}
              </button>
              <p className="text-xs text-center text-[#64748b] mt-4">
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-[#4f46e5] font-medium hover:underline">Create one</button>
              </p>
            </div>
          )}

{/* ── FORGOT PASSWORD ── */}
{mode === "forgot" && (
  <div className="p-7 sm:p-9">
    <h2 className="text-lg font-semibold text-[#0f172a] mb-1">
      Forgot your password?
    </h2>

    <p className="text-xs text-[#64748b] mb-6">
      Enter your registered email address to request a password reset.
    </p>

    <label className="block">
      <span className="text-xs font-medium text-[#0f172a] block mb-1.5">
        Email address
      </span>
      <input
        type="email"
        placeholder="you@university.edu.au"
        value={forgotEmail}
        onChange={(e) => setForgotEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !forgotLoading) {
            handleForgotPassword();
          }
        }}
        className={inputCls}
      />
    </label>

    {forgotError && (
      <div
        role="alert"
        className="mt-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg"
      >
        <p className="text-xs text-red-700">{forgotError}</p>
      </div>
    )}

    {forgotSuccess && (
      <div
        role="status"
        className="mt-4 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg"
      >
        <p className="text-xs text-green-700">{forgotSuccess}</p>
      </div>
    )}

    <button
      type="button"
      onClick={handleForgotPassword}
      disabled={forgotLoading}
      className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 text-sm disabled:opacity-60"
    >
      {forgotLoading ? "Processing..." : "Request password reset"}
    </button>

    <button
      type="button"
      onClick={() => {
        setMode("signin");
        setSiError("");
      }}
      className="block mx-auto mt-4 text-xs text-[#4f46e5] font-medium hover:underline"
    >
      Back to Sign In
    </button>
  </div>
)}

          {/* ── SIGN UP ── */}
          {mode === "signup" && (
            <div className="p-7 sm:p-9">
              <h2 className="text-lg font-semibold text-[#0f172a] mb-1">Create your account</h2>
              <p className="text-xs text-[#64748b] mb-6">Set up your career readiness profile.</p>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Preferred name</span>
                  <input
  type="text"
  placeholder="e.g. Mei"
  value={suName}
  onChange={(e) => {
    setSuName(e.target.value);
    setSuFieldErrors((prev) => ({ ...prev, name: undefined }));
  }}
  maxLength={101}
  className={inputCls}
  aria-invalid={!!suFieldErrors.name}
/>
                  {suFieldErrors.name && (
  <p className="text-xs text-red-600 mt-1" role="alert">
    {suFieldErrors.name}
  </p>
)}
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">University email address</span>
                 <input
  type="email"
  placeholder="you@university.edu.au"
  value={suEmail}
  onChange={(e) => {
    setSuEmail(e.target.value);
    setSuFieldErrors((prev) => ({ ...prev, email: undefined }));
  }}
  aria-invalid={!!suFieldErrors.email}
  className={inputCls}
/>
{suFieldErrors.email && (
  <p className="text-xs text-red-600 mt-1" role="alert">
    {suFieldErrors.email}
  </p>
)}
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">University</span>
                  <select
                    value={suUni}
                    onChange={(e) => setSuUni(e.target.value)}
                    className={`${inputCls} text-[${suUni ? "#0f172a" : "#94a3b8"}]`}
                  >
                    <option value="" disabled>Select your university (optional)</option>
                    {UNIS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Password</span>
                  <div className="relative">
                    <input
                      type={showSuPass ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      value={suPassword}
                      onChange={(e) => {
  setSuPassword(e.target.value);
  setSuFieldErrors((prev) => ({ ...prev, password: undefined }));
}}
                      className={`${inputCls} pr-10`}
                    />
                    <button onClick={() => setShowSuPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] text-xs">
                      {showSuPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  {suFieldErrors.password && (
  <p className="text-xs text-red-600 mt-1" role="alert">
    {suFieldErrors.password}
  </p>
)}
                  {suPassword.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {[4, 6, 8, 10].map((n) => (
                        <div key={n} className={`flex-1 h-1 rounded-full transition-colors ${suPassword.length >= n ? (suPassword.length >= 10 ? "bg-emerald-500" : suPassword.length >= 8 ? "bg-[#4f46e5]" : "bg-amber-400") : "bg-[#e2e8f0]"}`} />
                      ))}
                      <span className="text-[10px] text-[#94a3b8] ml-1">{suPassword.length < 6 ? "Weak" : suPassword.length < 8 ? "Fair" : suPassword.length < 10 ? "Good" : "Strong"}</span>
                    </div>
                  )}
                </label>

                <label className="block">
  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">
    Confirm password
  </span>

  <input
    type="password"
    placeholder="Re-enter your password"
    value={suConfirm}
    onChange={(e) => {
      setSuConfirm(e.target.value);
      setSuFieldErrors((prev) => ({ ...prev, confirm: undefined }));
    }}
    className={`${inputCls} ${
      suConfirm && suConfirm !== suPassword
        ? "border-red-300 focus:ring-red-400"
        : suConfirm && suConfirm === suPassword
        ? "border-emerald-400"
        : ""
    }`}
    aria-invalid={!!suFieldErrors.confirm}
  />

  {suFieldErrors.confirm && (
    <p className="text-xs text-red-600 mt-1" role="alert">
      {suFieldErrors.confirm}
    </p>
  )}

  {suConfirm && suConfirm !== suPassword && !suFieldErrors.confirm && (
    <p className="text-[10px] text-red-500 mt-1">
      Passwords do not match
    </p>
  )}

  {suConfirm && suConfirm === suPassword && (
    <p className="text-[10px] text-emerald-600 mt-1">
      ✓ Passwords match
    </p>
  )}
</label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div
                    onClick={() => {
  setSuAgree(!suAgree);
  setSuFieldErrors((prev) => ({ ...prev, privacy: undefined }));
}}
                    className={`mt-0.5 size-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${suAgree ? "bg-[#4f46e5] border-[#4f46e5]" : "border-[#cbd5e1] hover:border-[#4f46e5]"}`}
                  >
                    {suAgree && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-xs text-[#64748b] leading-relaxed">
                    I understand that this platform collects limited personal information to provide career preparation support, and that AI-generated feedback should be reviewed critically.{" "}
                    <button className="text-[#4f46e5] hover:underline">Privacy notice →</button>
                  </span>
                </label>
                {suFieldErrors.privacy && (
  <p className="text-xs text-red-600 mt-1" role="alert">
    {suFieldErrors.privacy}
  </p>
)}
              </div>

              {suError && (
                <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-500 flex-shrink-0 text-xs mt-0.5">✕</span>
                  <p className="text-xs text-red-700">{suError}</p>
                </div>
              )}

              <button
                onClick={handleSignUp}
                disabled={suLoading}
                className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {suLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Creating account…
                  </>
                ) : "Create account →"}
              </button>

              <p className="text-xs text-center text-[#64748b] mt-4">
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-[#4f46e5] font-medium hover:underline">Sign in</button>
              </p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-[#94a3b8] text-center mt-5 leading-relaxed px-4">
          This platform provides career preparation support only. It does not guarantee employment outcomes and does not replace professional career advice.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 1 — Landing
───────────────────────────────────────── */
function LandingScreen({ onStart, onLearn }: { onStart: () => void; onLearn: () => void }) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Top nav */}
      <header className="border-b border-[#e2e8f0] sticky top-0 bg-white/95 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <AppLogo size="md" />
          <nav className="flex items-center gap-5 text-sm">
            <button onClick={() => scrollTo("how")} className="text-[#64748b] hover:text-[#0f172a] transition-colors">How it works</button>
            <button onClick={() => scrollTo("responsible")} className="text-[#64748b] hover:text-[#0f172a] transition-colors">Responsible AI</button>
            <Btn onClick={onStart} size="sm">Get Started</Btn>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#25216b] to-[#5b21b6] text-white">
        <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-indigo-100">
              ✨ AI-powered career support for international students
            </span>

            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your career journey
              <span className="block bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                starts here.
              </span>
            </h1>

            <p className="mb-8 max-w-xl text-base leading-relaxed text-indigo-100 sm:text-lg">
              Build confidence for the Australian job market with personalised
              AI-assisted resume feedback, interview preparation and job matching
              — all in one place.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={onStart}
                className="rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-indigo-800 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Get Started →
              </button>
              <button
                onClick={() => scrollTo("how")}
                className="rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/20"
              >
                Explore Features
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-indigo-100">
              <span>✓ Personalised feedback</span>
              <span>✓ Australian career context</span>
              <span>✓ Responsible AI</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-5 rounded-3xl bg-violet-400/20 blur-2xl" />

            <div className="relative rounded-2xl border border-white/20 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AppLogo showText={false} size="md" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Your Career Toolkit</p>
                    <p className="text-xs text-slate-500">Prepare for your next opportunity</p>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  AI Assisted
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    icon: "📄",
                    title: "Resume Feedback",
                    desc: "Improve your resume with tailored insights",
                  },
                  {
                    icon: "🎤",
                    title: "Interview Preparation",
                    desc: "Practise questions and build confidence",
                  },
                  {
                    icon: "🎯",
                    title: "Job Matching",
                    desc: "Explore how your skills match job requirements",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                <p className="text-xs font-medium text-indigo-800">
                  ✨ Personalised career preparation, powered by AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section id="how" className="bg-gradient-to-b from-slate-50 to-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
              OUR CORE CAPABILITIES
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to prepare for your career
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Explore three AI-assisted tools designed to support international
              students preparing for employment in Australia.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: "📄",
                number: "01",
                title: "Resume Feedback",
                desc: "Upload your resume and receive personalised AI-assisted feedback on its structure, content and relevance to the Australian employment context.",
                cta: "Review My Resume",
                colour: "from-indigo-500 to-blue-600",
                background: "bg-indigo-50",
              },
              {
                icon: "🎤",
                number: "02",
                title: "Interview Preparation",
                desc: "Practise graduate and role-specific interview questions, receive constructive feedback and build confidence before real interviews.",
                cta: "Practise Interviews",
                colour: "from-violet-500 to-purple-600",
                background: "bg-purple-50",
              },
              {
                icon: "🎯",
                number: "03",
                title: "Job Matching",
                desc: "Compare your resume with job requirements to identify relevant skills, potential gaps and areas for improvement.",
                cta: "Explore Job Matching",
                colour: "from-cyan-500 to-teal-600",
                background: "bg-cyan-50",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`h-1.5 bg-gradient-to-r ${feature.colour}`} />

                <div className="flex flex-1 flex-col p-7">
                  <div className="mb-7 flex items-center justify-between">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.background} text-3xl`}>
                      {feature.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-300">
                      {feature.number}
                    </span>
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mb-8 flex-1 text-sm leading-7 text-slate-600">
                    {feature.desc}
                  </p>

                  <button
                    onClick={onStart}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:border-indigo-600 hover:bg-indigo-600 hover:text-white"
                  >
                    {feature.cta}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-slate-500">
            AI-assisted guidance supports career preparation and does not guarantee employment.
          </p>
        </div>
      </section>

      {/* Responsible AI trust */}
      <section id="responsible" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700">
              RESPONSIBLE AI
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Career support guided by responsible AI
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Our platform is designed around four principles that support
              responsible, transparent and student-centred AI assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "⚖️",
                label: "Fairness",
                desc: "Feedback focuses on career preparation, not personal characteristics.",
                background: "bg-indigo-50",
                accent: "from-indigo-500 to-blue-600",
              },
              {
                icon: "🔍",
                label: "Transparency",
                desc: "AI-generated content is clearly identified throughout the platform.",
                background: "bg-violet-50",
                accent: "from-violet-500 to-purple-600",
              },
              {
                icon: "🔒",
                label: "Privacy",
                desc: "Only information necessary for career preparation support is collected.",
                background: "bg-cyan-50",
                accent: "from-cyan-500 to-teal-600",
              },
              {
                icon: "👤",
                label: "Human Oversight",
                desc: "AI feedback supports preparation and does not replace professional advisers.",
                background: "bg-purple-50",
                accent: "from-purple-500 to-fuchsia-600",
              },
            ].map((principle) => (
              <div
                key={principle.label}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`h-1.5 bg-gradient-to-r ${principle.accent}`} />

                <div className="flex flex-1 flex-col items-center p-7 text-center">
                  <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${principle.background} text-3xl`}>
                    {principle.icon}
                  </div>

                  <h3 className="mb-3 text-lg font-bold text-slate-900">
                    {principle.label}
                  </h3>

                  <p className="text-sm leading-6 text-slate-600">
                    {principle.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-indigo-100 bg-indigo-50/70 px-6 py-5 text-center">
            <p className="text-sm leading-relaxed text-indigo-900">
              <span className="font-semibold">Important:</span>{" "}
              AI-generated recommendations should be reviewed critically
              and used alongside professional career guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-[#0f172a] py-14">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">Start building your career readiness today.</h2>
          <p className="text-[#94a3b8] text-sm mb-8 leading-relaxed max-w-xl mx-auto">
            This platform provides career preparation support for international students. It does not guarantee employment outcomes and does not replace professional career advice.
          </p>
          <Btn onClick={onStart} size="lg">Get Started</Btn>
          <p className="text-[#475569] text-xs mt-6">AI-generated recommendations should be reviewed critically and used alongside professional career advice.</p>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 2 — Onboarding
───────────────────────────────────────── */
function OnboardingScreen({ onDone }: { onDone: (name: string) => void }) {
  const [step, setStep] = useState(1);
  const [showWhy, setShowWhy] = useState(false);
  const [form, setForm] = useState({
    name: "Mei", field: "Information Technology", qualification: "Master of IT", role: "Software Developer", industry: "Technology", stage: "Preparing for graduate employment",
  });

  const STAGES = ["Preparing for graduate employment", "Currently applying for roles", "Preparing for upcoming interviews"];

  const next = () => { if (step < 2) setStep(2); else onDone(form.name || "Student"); };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      <header className="border-b border-[#e2e8f0] bg-white">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-[#4f46e5] text-white text-xs font-bold flex items-center justify-center">AI</div>
            <span className="font-semibold text-[#0f172a] text-sm">Career Readiness Assistant</span>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10 flex-1 w-full">
        {/* Step indicator */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <StepDot n={1} active={step === 1} done={step > 1} />
          <div className={`h-0.5 w-12 transition-colors ${step > 1 ? "bg-[#4f46e5]" : "bg-[#e2e8f0]"}`} />
          <StepDot n={2} active={step === 2} done={false} />
        </div>

        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">Welcome to Career Readiness Assistant</h1>
            <p className="text-sm text-[#64748b] mb-7">Tell us a little about yourself so we can personalise your experience.</p>

            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-[#64748b]">Step 1 of 2 — About you</p>
              <button onClick={() => setShowWhy(!showWhy)} className="text-xs text-[#4f46e5] hover:underline">Why we ask this ▾</button>
            </div>

            {showWhy && (
              <div className="mb-5 p-4 bg-[#eef2ff] border border-[#c7d2fe] rounded-xl text-xs text-[#3730a3] leading-relaxed">
                This information is used to contextualise the feedback you receive. For example, knowing your target role helps the AI generate more relevant interview questions and resume suggestions. We do not collect sensitive personal information such as visa status, ethnicity or health details.
              </div>
            )}

            <Card className="p-6 space-y-4">
              {[
                { label: "Preferred name", key: "name" as const, type: "text", placeholder: "e.g. Mei" },
                { label: "Field of study", key: "field" as const, type: "text", placeholder: "e.g. Information Technology" },
                { label: "Current qualification", key: "qualification" as const, type: "text", placeholder: "e.g. Master of IT" },
                { label: "Target job or role", key: "role" as const, type: "text", placeholder: "e.g. Software Developer" },
                { label: "Industry of interest", key: "industry" as const, type: "text", placeholder: "e.g. Technology, Finance, Healthcare" },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="text-xs font-medium text-[#0f172a] block mb-1.5">{f.label}</span>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent bg-white"
                  />
                </label>
              ))}
            </Card>

            <PrivacyNotice text="We only ask for information necessary to personalise career preparation support. We do not request visa status, ethnicity, health information or other sensitive attributes." />
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mb-1">Career stage</h1>
            <p className="text-sm text-[#64748b] mb-7">Let us know where you are in your career journey.</p>
            <p className="text-xs text-[#64748b] mb-5">Step 2 of 2 — Career stage</p>

            <Card className="p-4 mb-4 space-y-2">
              {STAGES.map((s) => (
                <button key={s} onClick={() => setForm({ ...form, stage: s })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors ${form.stage === s ? "bg-[#eef2ff] border-[#a5b4fc] text-[#4f46e5]" : "bg-white border-[#e2e8f0] text-[#475569] hover:border-[#94a3b8]"}`}>
                  <div className={`size-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${form.stage === s ? "border-[#4f46e5]" : "border-[#cbd5e1]"}`}>
                    {form.stage === s && <div className="size-2 rounded-full bg-[#4f46e5]" />}
                  </div>
                  {s}
                </button>
              ))}
            </Card>
          </>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => onDone(form.name || "Student")} className="text-xs text-[#94a3b8] hover:text-[#64748b] transition-colors">
            Skip optional information →
          </button>
          <Btn onClick={next}>{step === 1 ? "Continue →" : "Get started →"}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 3 — Dashboard
───────────────────────────────────────── */
function DashboardScreen({ userName, activity, activityLoading, activityError, onResume, onResumeHistory, onInterview, onJobMatch }: {
  userName: string; activity: ActivityState;
activityLoading: boolean;
activityError: string | null;
 onResume: () => void; onResumeHistory: () => void; onInterview: () => void; onJobMatch: () => void;
}) {
  const resumeProgress = activity.resumeReviews.length > 0 ? 100 : 0;
  const answeredInterviewQuestions = activity.interviewSessions.reduce(
  (total, session) => total + session.questionsAnswered,
  0
);

const totalInterviewQuestions = activity.interviewSessions.reduce(
  (total, session) => total + session.total,
  0
);

const interviewProgress =
  totalInterviewQuestions > 0
    ? Math.round(
        (answeredInterviewQuestions / totalInterviewQuestions) * 100
      )
    : 0;

  return (
    <div className="py-8 px-8 max-w-4xl mx-auto">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-7 sm:p-9 text-white shadow-lg shadow-indigo-200/50">

        <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />

        <div className="pointer-events-none absolute bottom-0 right-20 h-24 w-24 rounded-full bg-violet-300/20 blur-xl" />

        <div className="relative z-10">

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-100">
            Your Career Dashboard
          </p>

          <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {userName}!
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-indigo-100">
            Your next career opportunity starts with preparation. Continue building
            your skills and confidence for the Australian job market.
          </p>

        </div>

      </div>
      {activityLoading && (

        <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700" role="status">
          Loading your progress...
        </div>
      )}

      {activityError && !activityLoading && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          Unable to load your progress. Please try again.
        </div>
      )}
      {/* Primary feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[
          {
            icon: "📄",
            title: "Resume Feedback",
            desc: "Upload your resume and receive personalised feedback to strengthen your Australian graduate applications.",
            cta: "Review My Resume",
            action: onResume,
            gradient: "from-indigo-500 to-violet-600",
            light: "bg-indigo-50",
          },
          {
            icon: "🎙",
            title: "Interview Preparation",
            desc: "Practise interview questions and receive structured feedback to build confidence for your next interview.",
            cta: "Start Interview Practice",
            action: onInterview,
            gradient: "from-violet-500 to-purple-600",
            light: "bg-violet-50",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="group flex flex-col rounded-3xl border border-indigo-100 bg-white p-6 sm:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/60"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-2xl shadow-md`}>
                <span aria-hidden="true">{card.icon}</span>
              </div>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Ready
              </span>
            </div>

            <h3 className="mb-2 text-lg font-bold text-slate-900">
              {card.title}
            </h3>

            <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-500">
              {card.desc}
            </p>

            <button
              type="button"
              onClick={card.action}
              className={`w-full rounded-xl bg-gradient-to-r ${card.gradient} px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2`}
            >
              {card.cta} →
            </button>
          </div>
        ))}
      </div>

      {/* Job Matching card */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-100 p-6 shadow-sm sm:p-7">

        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-200/50 blur-2xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-start gap-4">

            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl shadow-md">
              <span aria-hidden="true">🎯</span>
            </div>

            <div className="min-w-0">

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Job Advertisement Matching
                </h3>
                <span className="rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-xs font-semibold text-violet-700">
                  Ready
                </span>
              </div>

              <p className="max-w-lg text-sm leading-relaxed text-slate-600">
                Compare your resume with Australian job advertisements,
                identify matching skills and discover areas for improvement.
              </p>

            </div>
          </div>

          <button
            type="button"
            onClick={onJobMatch}
            className="w-full flex-shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 sm:w-auto"
          >
            Analyse Job Match →
          </button>

        </div>
      </div>

      {/* Dashboard activity summary */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Your Activity Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track your career preparation progress.
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          {
            label: "Resumes Reviewed",
            value: activity.resumeReviews.length,
            action: onResumeHistory,
            icon: "📄",
            iconBg: "bg-indigo-100",
            accent: "text-indigo-600",
            link: "View resume history",
          },
          {
            label: "Interview Sessions",
            value: activity.interviewSessions.length,
            action: onInterview,
            icon: "🎙️",
            iconBg: "bg-violet-100",
            accent: "text-violet-600",
            link: "Practise interviews",
          },
          {
            label: "Questions Answered",
            value: answeredInterviewQuestions,
            action: onInterview,
            icon: "💬",
            iconBg: "bg-purple-100",
            accent: "text-purple-600",
            link: "Continue practising",
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg} text-2xl`}>
                <span aria-hidden="true">{item.icon}</span>
              </div>
              <span className="text-slate-300 transition-colors group-hover:text-indigo-500">
                ↗
              </span>
            </div>

            <p className="mb-2 text-sm font-medium text-slate-500">
              {item.label}
            </p>

            <p className="text-3xl font-bold tracking-tight text-slate-900">
              {activityLoading || activityError ? "—" : item.value}
            </p>

            <p className={`mt-4 text-xs font-semibold ${item.accent}`}>
              {item.link} →
            </p>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your latest career preparation activities.
            </p>
          </div>
          <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xl sm:flex">
            🕒
          </div>
        </div>

        {activityLoading ? (
          <div role="status" className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
            Loading recent activity...
          </div>
        ) : activityError ? (
          <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
            Recent activity is temporarily unavailable.
          </div>
        ) : (
          (() => {
            const recentActivities = [
              ...activity.resumeReviews.map((resume) => ({
                id: `resume-${resume.resume_id}`,
                title: `Resume submitted: ${resume.role || "General"}`,
                description: resume.file || "Pasted resume",
                date: resume.date,
                action: onResumeHistory,
                icon: "📄",
                iconBg: "bg-indigo-100",
              })),
              ...activity.interviewSessions.map((session) => ({
                id: `interview-${session.session_id}`,
                title: `Interview practice: ${session.role || "General"}`,
                description: `${session.questionsAnswered} questions answered`,
                date: session.date,
                action: onInterview,
                icon: "🎙️",
                iconBg: "bg-violet-100",
              })),
            ]
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .slice(0, 3);

            return recentActivities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-10 text-center">
                <div className="mb-4 text-4xl" aria-hidden="true">📋</div>
                <h3 className="mb-2 text-base font-semibold text-slate-900">
                  No recent activity yet
                </h3>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
                  Upload your first resume or start an interview practice
                  session to begin tracking your progress.
                </p>
                <button
                  type="button"
                  onClick={onResume}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                >
                  Review Your Resume →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                  >
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${item.iconBg} text-xl`}>
                      <span aria-hidden="true">{item.icon}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 break-words text-xs text-slate-500">
                        {item.description}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {item.date
                          ? (() => {
                              const parsed = new Date(item.date);
                              return Number.isNaN(parsed.getTime())
                                ? item.date
                                : parsed.toLocaleDateString("en-AU", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  });
                            })()
                          : "Date unavailable"}
                      </p>
                    </div>

                    <span aria-hidden="true" className="flex-shrink-0 text-lg text-slate-300 transition-colors group-hover:text-indigo-600">
                      →
                    </span>
                  </button>
                ))}
              </div>
            );
          })()
        )}
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Your Progress
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            See how much of your recorded preparation activity you have completed.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

          {/* Resume Review Progress */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">

            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
                <span aria-hidden="true">📄</span>
              </div>
              <span className="text-2xl font-bold text-indigo-700">
                {resumeProgress}%
              </span>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Resume Review
            </h3>

            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              {resumeProgress === 0
                ? "Upload your first resume to begin."
                : "At least one resume review has been recorded."}
            </p>

            <div
              role="progressbar"
              aria-label="Resume review activity"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={resumeProgress}
              className="h-2.5 overflow-hidden rounded-full bg-indigo-100"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
                style={{ width: `${resumeProgress}%` }}
              />
            </div>
          </div>

          {/* Interview Practice Progress */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5">

            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
                <span aria-hidden="true">🎙️</span>
              </div>
              <span className="text-2xl font-bold text-violet-700">
                {interviewProgress}%
              </span>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Interview Practice
            </h3>

            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              {totalInterviewQuestions === 0
                ? "Start your first interview practice session."
                : `${answeredInterviewQuestions} of ${totalInterviewQuestions} recorded questions answered.`}
            </p>

            <div
              role="progressbar"
              aria-label="Interview practice activity"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={interviewProgress}
              className="h-2.5 overflow-hidden rounded-full bg-violet-100"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
                style={{ width: `${interviewProgress}%` }}
              />
            </div>
          </div>

        </div>

        <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
          Progress reflects recorded activity within this platform.
          It does not measure actual job readiness or predict employment outcomes.
        </p>

      </div>

      <AIDisclaimer text="AI-generated feedback should be reviewed critically and used alongside professional career advice. This platform supports career preparation and does not guarantee employment outcomes." />
    </div>
  );
}
/* ─────────────────────────────────────────
   My Resume Reviews — saved history
───────────────────────────────────────── */
function ResumeHistoryScreen({
  resumes,
  onUpload,
}: {
  resumes: ResumeHistoryEntry[];
  onUpload: () => void;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

      {/* Resume History header */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-100 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-100">
          Career Preparation
        </p>

        <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
          My Resume Reviews
        </h1>

        <p className="max-w-xl text-sm leading-relaxed text-indigo-100">
          Keep track of your previously submitted resumes and the job roles
          you have targeted during your career preparation.
        </p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/15 px-4 py-3">
          <span className="text-2xl font-bold">{resumes.length}</span>
          <span className="text-xs font-medium text-indigo-100">
            {resumes.length === 1 ? "Resume Submitted" : "Resumes Submitted"}
          </span>
        </div>
      </div>

      {/* History content */}
      {resumes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
            📄
          </div>

          <h2 className="mb-2 text-lg font-bold text-slate-900">
            No Resume Reviews Yet
          </h2>

          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-slate-500">
            You have not submitted a resume yet. Start by uploading your
            resume or pasting its text to receive AI-assisted feedback.
          </p>

          <button
            type="button"
            onClick={onUpload}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700"
          >
            Analyse Your First Resume →
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Submission History
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Your previously submitted resumes and target roles.
              </p>
            </div>

            <button
              type="button"
              onClick={onUpload}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              + Analyse Another Resume
            </button>
          </div>

          <div className="space-y-3">
            {resumes.map((resume) => (
              <div
                key={resume.resume_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                    📄
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-bold text-slate-900 sm:text-base">
                      {resume.file || "Pasted Resume"}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                        Target Role: {resume.role || "Not specified"}
                      </span>

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        Submitted: {resume.date || "Date unavailable"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 4 — Resume upload
───────────────────────────────────────── */
function ResumeUploadScreen({ onAnalyse }: { onAnalyse: (content: string, role: string, fileName: string) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [role, setRole] = useState("Software Developer");
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");

 const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setDragOver(false);

  const droppedFile = e.dataTransfer.files[0];
  if (!droppedFile) return;

  if (
    ![
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(droppedFile.type)
  ) {
    setError("Unsupported file type. Please upload a PDF or DOCX file.");
    setSelectedFile(null);
    return;
  }

  setError("");
  setFile(droppedFile.name);
  setSelectedFile(droppedFile);
  setResumeText("");
}, []);

const fileInputRef = useRef<HTMLInputElement>(null);

const handleFileSelect = () => {
  fileInputRef.current?.click();
};

 const canAnalyse =
  inputMode === "paste"
    ? resumeText.trim().length >= 50
    : selectedFile !== null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">

      {/* Resume Feedback header */}
      <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-7 text-white shadow-lg shadow-indigo-200/50 sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-100">
            Career Preparation
          </p>

          <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Resume Feedback
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-indigo-100">
            Upload your resume or paste its text to receive personalised
            AI-assisted feedback for Australian job applications.
          </p>
        </div>
      </div>

      {/* Input mode toggle */}
      <div className="mb-5 rounded-2xl border border-indigo-100 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          {(["upload", "paste"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setInputMode(m)}
              aria-pressed={inputMode === m}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${
                inputMode === m
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              {m === "upload" ? "📄 Upload File" : "✍️ Paste Resume Text"}
            </button>
          ))}
        </div>
      </div>

      {inputMode === "upload" ? (
        <div className="mb-6 overflow-hidden rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-6">

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={handleFileSelect}
            className={`cursor-pointer rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-all sm:px-8 ${
              dragOver
                ? "border-indigo-500 bg-indigo-100"
                : file
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-indigo-200 bg-indigo-50/40 hover:border-indigo-400 hover:bg-indigo-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const chosenFile = e.target.files?.[0];
                if (!chosenFile) return;

                if (
                  ![
                    "application/pdf",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  ].includes(chosenFile.type)
                ) {
                  setError("Unsupported file type. Please upload a PDF or DOCX file.");
                  setFile(null);
                  setSelectedFile(null);
                  e.target.value = "";
                  return;
                }

                setError("");
                setFile(chosenFile.name);
                setSelectedFile(chosenFile);
                setResumeText("");
              }}
            />

            {file ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                  📄
                </div>

                <p className="mb-2 break-all text-sm font-semibold text-emerald-800">
                  {file}
                </p>

                <p className="text-xs font-medium text-emerald-600">
                  File selected successfully
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setSelectedFile(null);
                    setResumeText("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove File
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-3xl text-white shadow-md shadow-indigo-200">
                  ↑
                </div>

                <h3 className="mb-2 text-base font-bold text-slate-900">
                  Drag and drop your resume here
                </h3>

                <p className="mb-5 text-sm text-slate-500">
                  Or click anywhere in this box to choose a file.
                </p>

                <span className="inline-flex rounded-full border border-indigo-100 bg-white px-4 py-2 text-xs font-medium text-indigo-700">
                  PDF and DOCX resumes supported (maximum 5 MB).
                </span>
              </>
            )}
          </div>

          {error && (
            <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <span className="text-sm text-red-600">✕</span>
              <p className="text-xs leading-relaxed text-red-700">{error}</p>
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            PDF and DOCX resumes are processed automatically. For scanned or image-only PDFs, use the "Paste Resume Text" option.
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
              <span aria-hidden="true">✍️</span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Paste Your Resume
              </h2>
              <p className="text-xs text-slate-500">
                Enter your resume content for AI-assisted analysis.
              </p>
            </div>
          </div>

          <label
            htmlFor="resume-text"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Resume Text
          </label>

          <textarea
            id="resume-text"
            rows={12}
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              setFile(null);
              setSelectedFile(null);

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            placeholder="Paste your resume here. Include your education, professional experience, technical skills, projects and other relevant information..."
            className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm leading-relaxed text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Minimum 50 characters required for analysis.
            </p>

            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              resumeText.trim().length >= 50
                ? "bg-emerald-50 text-emerald-700"
                : "bg-indigo-50 text-indigo-600"
            }`}>
              {resumeText.trim().length} characters
            </span>
          </div>
        </div>
      )}

      {/* Target Role */}
      <div className="mb-6 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
            <span aria-hidden="true">🎯</span>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Target Job Role
            </h2>
            <p className="text-xs text-slate-500">
              Tailor your resume feedback to your preferred career.
            </p>
          </div>
        </div>

        <label htmlFor="target-resume-role" className="mb-2 block text-sm font-semibold text-slate-700">
          Job Title
        </label>

        <input
          id="target-resume-role"
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Software Developer"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />

        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Choose a role that matches the type of job you want to apply for in Australia.
        </p>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 text-xl">
            🔒
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-900">
              Your Privacy Matters
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Your resume may contain personal information. Only upload
              information you are comfortable sharing for AI-assisted analysis.
              Review your resume before submitting it.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4">

<button
  type="button"
  onClick={async () => {
    setError("");

    if (inputMode === "paste") {
      onAnalyse(
        resumeText,
        role || "the target role",
        "Pasted resume text"
      );
      return;
    }

    if (!selectedFile) {
      setError("Please select a resume file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const response = await fetch(
        "/api/resume-upload.php",
        {
          method: "POST",
        credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to read the resume file.");
        return;
      }

      if (!data.resume_text?.trim()) {
        setError("No readable resume text was found in the uploaded file.");
        return;
      }

      setResumeText(data.resume_text);

      onAnalyse(
        data.resume_text,
        role || "the target role",
        data.file_name || selectedFile.name
      );
    } catch (error) {
      console.error("Resume file upload failed:", error);
      setError("Unable to process the resume file. Please try again.");
    }
  }}
  disabled={!canAnalyse}
  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
>
  {canAnalyse
    ? "Analyse Resume →"
    : "Upload or paste your resume to continue"}
</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Shared — AI Error Screen
───────────────────────────────────────── */
function AIErrorScreen({
  context = "AI-generated",
  message,
  onRetry,
  onBack,
}: {
  context?: string;
  message?: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-3xl flex-col justify-center px-4 py-10 sm:px-8">

      {/* Error header */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-7 text-center text-white shadow-lg shadow-indigo-100 sm:p-9">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-100">
          AI Career Readiness Assistant
        </p>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Something Went Wrong
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-indigo-100">
          We could not complete your AI-assisted request.
        </p>
      </div>

      {/* Error information */}
      <div
        role="alert"
        className="rounded-2xl border border-slate-200 bg-white px-6 py-9 text-center shadow-sm sm:px-10"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50">
          <svg
            className="h-10 w-10 text-rose-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h2 className="mb-3 text-xl font-bold text-slate-900">
          We Couldn't Generate Your Results
        </h2>

        <p className="mx-auto mb-4 max-w-md text-sm leading-relaxed text-slate-600">
          {message ??
            "The AI service is temporarily unavailable or the request could not be completed. Your results have not been generated. Please try again."}
        </p>

        <div className="mx-auto mb-7 max-w-md rounded-xl border border-amber-100 bg-amber-50/70 p-4">
          <p className="text-xs leading-relaxed text-amber-900">
            {context} features may occasionally be unavailable due to
            technical or service issues.
          </p>
        </div>

        <div className="mx-auto flex max-w-sm flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            Try Again
          </button>

          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            Go Back
          </button>
        </div>

        <p className="mx-auto mt-6 max-w-sm text-xs leading-relaxed text-slate-500">
          Retrying does not guarantee success if the service remains unavailable.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 4b — Resume analysing
───────────────────────────────────────── */
function ResumeAnalysingScreen() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-3xl flex-col justify-center px-4 py-10 sm:px-8">

      {/* Loading header */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-7 text-center text-white shadow-lg shadow-indigo-100 sm:p-9">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-100">
          AI Career Readiness Assistant
        </p>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Analysing Your Resume
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-indigo-100">
          Please wait while we prepare personalised AI-assisted feedback
          for your target job role.
        </p>
      </div>

      {/* Analysis status */}
      <div
        className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10"
        role="status"
        aria-live="polite"
      >
        <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-indigo-600 border-r-violet-500" />

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl">
            📄
          </div>
        </div>

        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Preparing Your Feedback
        </h2>

        <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600">
          Your resume is being processed to identify relevant skills,
          experience and potential improvements.
        </p>

        <div className="mx-auto mt-7 flex max-w-sm items-center justify-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-600" />
          </span>
          <span className="text-xs font-semibold text-indigo-700">
            AI analysis in progress
          </span>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-slate-500">
          Processing time may vary depending on your resume and the AI service.
        </p>
      </div>

      <div className="mt-6">
        <AIDisclaimer text="AI analysis is in progress. Generated feedback should be reviewed critically before making changes to your resume." />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 5 — Resume feedback results
───────────────────────────────────────── */
const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-50 text-slate-600 border-slate-200",
};

function ResumeResultsScreen({ onBack, onUploadNew, feedback }: { onBack: () => void; onUploadNew: () => void; feedback: ResumeFeedback }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "sections">("overview");

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const allItems = feedback.sections.flatMap((s) => s.items);
  const highCount = allItems.filter((i) => i.priority === "High").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

      {/* Results header */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-100 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-100">
              AI Career Readiness Assistant
            </p>
            <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Your Resume Feedback
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-indigo-100">
              Explore your resume strengths, identify areas for improvement,
              and prepare a stronger application for your target role.
            </p>
          </div>

          <button
            type="button"
            onClick={onUploadNew}
            className="shrink-0 rounded-xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Analyse Another Resume
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="max-w-full break-words rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-indigo-50">
            Resume: {feedback.resumeLabel}
          </span>
          <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-indigo-50">
            Target role: {feedback.targetRole}
          </span>
        </div>
      </div>

      {/* Results navigation */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {([["overview", "Overview"], ["sections", "Detailed Feedback"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            aria-pressed={activeTab === key}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* AI Overview */}
          <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-700">
                ✦
              </div>
              <div className="min-w-0">
                <h2 className="mb-2 text-base font-bold text-slate-900">
                  AI Overview
                </h2>
                <p className="text-sm leading-7 text-slate-700">
                  {feedback.overview}
                </p>
              </div>
            </div>
            <p className="mt-4 border-t border-indigo-100 pt-3 text-xs leading-relaxed text-slate-500">
              AI-generated guidance is intended to support your review,
              not guarantee employment outcomes.
            </p>
          </div>

          {/* Role Relevance */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900">
                Role Relevance
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                How your resume evidence relates to your selected target role.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    ✓
                  </span>
                  <h3 className="text-sm font-semibold text-emerald-900">
                    Strong Match
                  </h3>
                </div>
                <ul className="space-y-2">
                  {feedback.roleRelevance.strong.map((item, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-emerald-100 bg-white px-3 py-3 text-xs leading-relaxed text-slate-700"
                    >
                      {item}
                    </li>
                  ))}
                  {feedback.roleRelevance.strong.length === 0 && (
                    <li className="text-xs text-slate-500">
                      No strong matches identified.
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    ◐
                  </span>
                  <h3 className="text-sm font-semibold text-amber-900">
                    Partial Match
                  </h3>
                </div>
                <ul className="space-y-2">
                  {feedback.roleRelevance.partial.map((item, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-amber-100 bg-white px-3 py-3 text-xs leading-relaxed text-slate-700"
                    >
                      {item}
                    </li>
                  ))}
                  {feedback.roleRelevance.partial.length === 0 && (
                    <li className="text-xs text-slate-500">
                      No partial matches identified.
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                    !
                  </span>
                  <h3 className="text-sm font-semibold text-rose-900">
                    Not Evidenced
                  </h3>
                </div>
                <ul className="space-y-2">
                  {feedback.roleRelevance.missing.map((item, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-rose-100 bg-white px-3 py-3 text-xs leading-relaxed text-slate-700"
                    >
                      {item}
                    </li>
                  ))}
                  {feedback.roleRelevance.missing.length === 0 && (
                    <li className="text-xs text-slate-500">
                      No evidence gaps identified.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Key Strengths */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-700">
                ✓
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Key Strengths
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Positive elements identified in your resume.
                </p>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {feedback.strengths.map((strength, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    ✓
                  </span>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {strength}
                  </p>
                </li>
              ))}
              {feedback.strengths.length === 0 && (
                <li className="text-sm text-slate-500">
                  No specific strengths were identified in this analysis.
                </li>
              )}
            </ul>
          </div>

          {/* Priority Improvements summary */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Priority Improvements
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Actionable recommendations to strengthen your resume.
                </p>
              </div>

              {highCount > 0 && (
                <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                  {highCount} High Priority
                </span>
              )}
            </div>

            <div className="space-y-3">
              {[
                ...allItems.filter((item) => item.priority === "High"),
                ...allItems.filter((item) => item.priority !== "High").slice(0, 3),
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-start"
                >
                  <span
                    className={`w-fit shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLES[item.priority]}`}
                  >
                    {item.priority} Priority
                  </span>

                  <p className="text-sm leading-relaxed text-slate-700">
                    {item.suggestion}
                  </p>
                </div>
              ))}

              {allItems.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No specific improvements were identified in this analysis.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("sections")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              View Detailed Feedback
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <AIDisclaimer />
        </>
      )}

      {activeTab === "sections" && (
        <>
          <AIDisclaimer />

          {/* Section navigation */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Explore Detailed Feedback
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Select a resume section to review observations and
                actionable suggestions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {feedback.sections.map((section, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSection(i)}
                  aria-pressed={activeSection === i}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                    activeSection === i
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <span className="mr-1.5">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {feedback.sections.map((section, si) =>
            si !== activeSection ? null : (
              <div key={si}>
                <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 sm:p-6">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                        {section.icon}
                      </span>
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                          Resume Section
                        </p>
                        <h2 className="text-lg font-bold text-slate-900">
                          {section.title}
                        </h2>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {section.summary}
                    </p>
                  </div>

                  <div className="space-y-4 p-4 sm:p-6">
                    {section.items.map((item, ii) => (
                      <div
                        key={ii}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                          <h3 className="text-sm font-semibold text-slate-800">
                            Feedback {ii + 1}
                          </h3>
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLES[item.priority]}`}
                          >
                            {item.priority} Priority
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-sm">
                                👁
                              </span>
                              <h4 className="text-sm font-semibold text-slate-800">
                                Observation
                              </h4>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-600">
                              {item.observation}
                            </p>
                          </div>

                          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm">
                                💡
                              </span>
                              <h4 className="text-sm font-semibold text-slate-800">
                                Why It Matters
                              </h4>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-600">
                              {item.why}
                            </p>
                          </div>

                          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-sm">
                                ✏️
                              </span>
                              <h4 className="text-sm font-semibold text-slate-800">
                                Suggested Improvement
                              </h4>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-600">
                              {item.suggestion}
                            </p>
                            <button
                              type="button"
                              onClick={() => copy(item.suggestion, `${si}-${ii}`)}
                              className="mt-4 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                              {copied === `${si}-${ii}` ? "✓ Copied" : "Copy Suggestion"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {section.items.length === 0 && (
                      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        No detailed feedback was generated for this section.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {si > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveSection(si - 1)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      ← Previous
                    </button>
                  )}

                  {si < feedback.sections.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveSection(si + 1)}
                      className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                      Next Section →
                    </button>
                  )}

                  <div className="hidden flex-1 sm:block" />

                  <button
                    type="button"
                    onClick={onUploadNew}
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    Analyse Another Resume
                  </button>
                </div>
              </div>
            )
          )}

        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 5b — Interview generating (questions)
───────────────────────────────────────── */
function InterviewGeneratingScreen() {
  return (
    <div className="py-8 px-8 max-w-md mx-auto text-center flex flex-col items-center justify-center min-h-[calc(100vh-56px)]">
      <div className="size-20 rounded-2xl bg-[#eef2ff] flex items-center justify-center mb-8">
        <svg
          className="w-8 h-8 text-[#4f46e5] animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
      </div>

      <h1 className="text-xl font-semibold text-[#0f172a] mb-3 tracking-tight">
        Preparing your interview questions…
      </h1>

      <p className="text-sm text-[#64748b] mb-8 leading-relaxed max-w-xs">
        AI is generating interview questions based on your selected role,
        industry, interview type and difficulty.
      </p>

      <div className="flex gap-1.5 justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="size-2 rounded-full bg-[#4f46e5] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <AIDisclaimer text="AI-generated interview questions may be incomplete or inaccurate. Review them critically and use them for career-readiness practice only." />
    </div>
  );
}
/* ─────────────────────────────────────────
   SCREEN 7b — Interview feedback generating
───────────────────────────────────────── */
function InterviewFeedbackGeneratingScreen() {
  return (
    <div className="py-8 px-8 max-w-md mx-auto text-center flex flex-col items-center justify-center min-h-[calc(100vh-56px)]">
      <div className="size-20 rounded-2xl bg-[#eef2ff] flex items-center justify-center mb-8">
        <svg
          className="w-8 h-8 text-[#4f46e5] animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
      </div>

      <h1 className="text-xl font-semibold text-[#0f172a] mb-3 tracking-tight">
        Generating your feedback…
      </h1>

      <p className="text-sm text-[#64748b] mb-8 leading-relaxed max-w-xs">
        AI is analysing your submitted interview responses and preparing personalised feedback.
      </p>

      <div className="flex gap-1.5 justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="size-2 rounded-full bg-[#4f46e5] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <AIDisclaimer text="AI-generated feedback may be incomplete or inaccurate. Review the recommendations critically and use them as career-readiness guidance rather than a prediction of employment outcomes." />
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 6 — Interview setup
───────────────────────────────────────── */
 function InterviewSetupScreen({
  onStart,
  userName,
}: {
  onStart: (config: {
    role: string;
    industry: string;
    type: string;
    difficulty: string;
    count: number;
    useProfile: boolean;
  }) => void;
  userName: string;
}) {
  const [role, setRole] = useState("Software Developer");
  const [industry, setIndustry] = useState("Technology");
  const [type, setType] = useState("Behavioural");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [count, setCount] = useState(5);
  const [useProfile, setUseProfile] = useState(false);

  const TYPES = [
    "Behavioural",
    "General graduate interview",
    "Role-specific",
    "Mixed practice",
  ];
  const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
  const COUNTS = [3, 5, 10];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Interview header */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-100 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-100">
          Career Preparation
        </p>
        <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Interview Preparation
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-indigo-100">
          Build confidence through AI-assisted mock interviews tailored to
          your target role, experience and career goals.
        </p>
      </div>

      {/* Interview configuration */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Set Up Your Practice Interview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose your preferences to personalise your interview session.
          </p>
        </div>

        {/* Target role and industry */}
        <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Target Job Role
            </span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Developer"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Industry
            </span>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Technology"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

        {/* Interview type */}
        <div className="mb-7">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Interview Type
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Select the type of questions you would like to practise.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TYPES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                aria-pressed={type === option}
                className={`rounded-xl border px-4 py-4 text-left text-sm font-semibold transition-all ${
                  type === option
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40"
                }`}
              >
                <span className="mr-2">{type === option ? "◉" : "○"}</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-7">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Difficulty Level
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Choose a level that matches your interview experience.
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {DIFFICULTIES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDifficulty(option)}
                aria-pressed={difficulty === option}
                className={`rounded-xl border px-2 py-3 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${
                  difficulty === option
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Question count */}
        <div className="mb-7">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Number of Questions
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Decide how many interview questions you want to practise.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {COUNTS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCount(option)}
                aria-pressed={count === option}
                className={`rounded-xl border px-4 py-4 text-center transition-all ${
                  count === option
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                }`}
              >
                <span className="block text-xl font-bold">{option}</span>
                <span className="mt-1 block text-xs">Questions</span>
              </button>
            ))}
          </div>
        </div>

        {/* Career profile */}
        <button
          type="button"
          onClick={() => setUseProfile(!useProfile)}
          aria-pressed={useProfile}
          className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
            useProfile
              ? "border-indigo-300 bg-indigo-50"
              : "border-slate-200 bg-slate-50/50 hover:border-indigo-200"
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
              useProfile
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-300 bg-white"
            }`}
          >
            {useProfile ? "✓" : ""}
          </span>

          <span>
            <span className="block text-sm font-semibold text-slate-800">
              Use My Career Profile
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500">
              {userName
                ? `Use available career profile information for ${userName} to personalise questions.`
                : "Use available career profile information to personalise questions."}
            </span>
          </span>
        </button>
      </div>

      {/* Responsible AI notice */}
      <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
        <p className="text-xs leading-relaxed text-slate-600">
          🔒 This practice session uses text-based responses. It does not
          include video, audio, facial or emotion analysis. AI feedback is
          intended for practice and should be reviewed critically.
        </p>
      </div>

      {/* Start practice */}
      <button
        type="button"
        onClick={() =>
          onStart({ role, industry, type, difficulty, count, useProfile })
        }
        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
      >
        Start Practice →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 7 — Interview question
───────────────────────────────────────── */
function InterviewQuestionScreen({
  qIndex,
  total,
  answeredCount,
  question,
  onSubmit,
  onSkip,
  onEnd,
}: {
  qIndex: number;
  total: number;
  answeredCount: number;
  question: IQ;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  onEnd: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [showGuidance, setShowGuidance] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const completed = total > 0 ? Math.min(qIndex, total) : 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const q = question;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-100 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-100">
          Mock Interview Session
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Interview Practice
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-indigo-100">
          Take your time, reflect on your experience and practise responding
          confidently to each question.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Question {qIndex + 1} of {total}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {answeredCount} {answeredCount === 1 ? "response" : "responses"} submitted
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            {pct}% of questions completed
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Interview questions completed"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {q.type}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {q.difficulty}
          </span>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Your Interview Question
        </p>
        <h2 className="mb-7 text-lg font-bold leading-relaxed text-slate-900 sm:text-xl">
          {q.q}
        </h2>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-800">
            Your Response
          </span>
          <span className="mb-3 block text-xs leading-relaxed text-slate-500">
            Write your answer as though you were speaking to an interviewer.
            Use examples from your own experience where possible.
          </span>
          <textarea
            rows={8}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your interview response here..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm leading-relaxed text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <p className="mt-2 text-right text-xs text-slate-400">
          {answer.trim().length} characters
        </p>
      </div>

      {/* Preparation resources */}
      <div className="mb-6 space-y-3">
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowGuidance((value) => !value)}
            aria-expanded={showGuidance}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-indigo-700 hover:bg-indigo-50/50"
          >
            <span>💡 Interview Guidance</span>
            <span aria-hidden="true">{showGuidance ? "−" : "+"}</span>
          </button>
          {showGuidance && (
            <div className="border-t border-indigo-100 bg-indigo-50/50 px-5 py-4">
              <p className="text-sm leading-relaxed text-slate-700">
                {q.guidance}
              </p>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowSample((value) => !value)}
            aria-expanded={showSample}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50/50"
          >
            <span>📖 View Sample Answer</span>
            <span aria-hidden="true">{showSample ? "−" : "+"}</span>
          </button>
          {showSample && (
            <div className="border-t border-emerald-100 bg-emerald-50/50 px-5 py-4">
              <p className="text-sm leading-relaxed text-slate-700">
                {q.sampleAnswer}
              </p>
              <p className="mt-3 text-xs italic leading-relaxed text-emerald-800">
                This is an example only. Adapt your response to reflect
                your own experience, skills and circumstances.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => {
            if (answer.trim()) {
              onSubmit(answer);
              setAnswer("");
            }
          }}
          disabled={!answer.trim()}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Response →
        </button>

        <button
          type="button"
          onClick={() => {
            onSkip();
            setAnswer("");
          }}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Skip Question
        </button>

        <button
          type="button"
          onClick={() => setShowEndModal(true)}
          className="rounded-xl px-5 py-3.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 sm:ml-auto"
        >
          End Practice
        </button>
      </div>

      {/* End session confirmation */}
      {showEndModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-interview-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-2xl">
              ⚠️
            </div>
            <h3
              id="end-interview-title"
              className="mb-3 text-lg font-bold text-slate-900"
            >
              End Practice Session?
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              You have progressed through {qIndex} of {total} questions
              and submitted {answeredCount}{" "}
              {answeredCount === 1 ? "response" : "responses"}.
              A session summary will be shown.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Continue Practice
              </button>
              <button
                type="button"
                onClick={onEnd}
                className="flex-1 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 8 — Interview feedback
───────────────────────────────────────── */
function InterviewFeedbackScreen({
  qIndex,
  total,
  question,
  answer,
  onNext,
  onRetry,
  onEnd,
}: {
  qIndex: number;
  total: number;
  question: IQ;
  answer: string;
  onNext: () => void;
  onRetry: () => void;
  onEnd: () => void;
}) {
  const q = question;
  const fb = getFeedbackForQuestion(q, qIndex);
  const isLast = qIndex === total - 1;

  const guidanceItems = [
    {
      icon: "✓",
      label: "What Worked Well",
      text: fb.strength,
      style: "border-emerald-200 bg-emerald-50/70",
      heading: "text-emerald-800",
    },
    {
      icon: "△",
      label: "Areas for Improvement",
      text: fb.improvement,
      style: "border-amber-200 bg-amber-50/70",
      heading: "text-amber-800",
    },
    {
      icon: "✏",
      label: "Suggested Approach",
      text: fb.suggestion,
      style: "border-indigo-200 bg-indigo-50/70",
      heading: "text-indigo-800",
    },
    {
      icon: "⊞",
      label: "Response Structure",
      text: fb.structure,
      style: "border-slate-200 bg-slate-50",
      heading: "text-slate-800",
    },
    {
      icon: "◉",
      label: "Clarity and Relevance",
      text: fb.clarity,
      style: "border-slate-200 bg-slate-50",
      heading: "text-slate-800",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-100 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-100">
          Question {qIndex + 1} of {total}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Interview Answer Guidance
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-100">
          Review practical suggestions to strengthen your interview
          preparation and build confidence.
        </p>
      </div>

      {/* Guidance transparency */}
      <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl" aria-hidden="true">ℹ️</span>
          <div>
            <p className="text-sm font-semibold text-sky-900">
              About This Guidance
            </p>
            <p className="mt-1 text-xs leading-relaxed text-sky-800">
              This version provides general practice guidance based on
              predefined examples. Your submitted response has not been
              individually analysed by AI.
            </p>
          </div>
        </div>
      </div>

      {/* Question recap */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Interview Question
          </p>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {q.type}
          </span>
        </div>
        <p className="text-base font-semibold leading-relaxed text-slate-900">
          {q.q}
        </p>
      </div>

      {/* Student response */}
      <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-sm font-bold text-slate-900">
          Your Submitted Response
        </h2>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
            {answer || "No response provided."}
          </p>
        </div>
      </div>

      {/* General guidance */}
      <div className="mb-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">
          Practice Guidance
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-slate-500">
          Use these suggestions to reflect on your answer and prepare
          for future interviews.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {guidanceItems.map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border p-5 ${item.style}`}
            >
              <h3 className={`mb-3 text-sm font-bold ${item.heading}`}>
                <span className="mr-2" aria-hidden="true">{item.icon}</span>
                {item.label}
              </h3>
              <p className="text-sm leading-relaxed text-slate-700">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Responsible AI */}
      <AIDisclaimer text="This is general practice guidance from predefined examples and does not analyse your submitted response. It does not assess personality, accent, ethnicity or predict interview success." />

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={isLast ? onEnd : onNext}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
        >
          {isLast ? "View Session Summary →" : "Next Question →"}
        </button>

        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 9 — Interview summary
───────────────────────────────────────── */

function InterviewSummaryScreen({
  total,
  completed,
  feedback,
  sessionStatus,
  onPracticeAgain,
  onDashboard,
}: {
  total: number;
  completed: number;
  feedback: InterviewAIFeedback | null;
  sessionStatus: "completed" | "ended_early";
  onPracticeAgain: () => void;
  onDashboard: () => void;
}) {
  const safeTotal = Math.max(0, total);
  const answered = Math.min(Math.max(0, completed), safeTotal);
  const progress = safeTotal > 0
    ? Math.round((answered / safeTotal) * 100)
    : 0;

  const endedEarly =
    sessionStatus === "ended_early" || answered < safeTotal;

  const hasFeedback = answered > 0 && feedback !== null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-7 sm:p-9 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute right-12 bottom-0 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            🎙️
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
            Interview preparation
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Your Interview Summary
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-indigo-100">
            Review your practice session, explore personalised AI feedback
            and identify practical ways to improve your interview responses.
          </p>

          <div className="mt-6 inline-flex items-center rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold">
            {endedEarly ? "Session ended early" : "Session completed"}
          </div>
        </div>
      </div>

      {/* Session overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Questions answered",
            value: `${answered} / ${safeTotal}`,
            detail: "Submitted responses",
            icon: "📝",
          },
          {
            label: "Session status",
            value: endedEarly ? "Ended early" : "Complete",
            detail: endedEarly
              ? "You can practise again anytime"
              : "All questions answered",
            icon: "🎯",
          },
          {
            label: "Session progress",
            value: `${progress}%`,
            detail: "Questions answered",
            icon: "📈",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                {stat.label}
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                {stat.icon}
              </span>
            </div>

            <p className="text-2xl font-bold tracking-tight text-slate-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stat.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Interview progress
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {answered} of {safeTotal} questions answered
            </p>
          </div>
          <span className="text-lg font-bold text-indigo-600">
            {progress}%
          </span>
        </div>

        <div
          className="h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Interview completion progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {hasFeedback && feedback && (
        <>
          {/* Overall feedback */}
          <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
            <div className="border-b border-indigo-100 bg-indigo-50/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xl">
                  ✨
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Your personalised AI feedback
                  </h2>
                  <p className="text-xs text-slate-500">
                    Based on your submitted interview responses
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="mb-3 text-sm font-semibold text-indigo-700">
                Overall assessment
              </h3>
              <p className="text-sm leading-7 text-slate-600 whitespace-pre-line">
                {feedback.overall_feedback}
              </p>
            </div>
          </section>

          {/* Strengths and improvements */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  ✓
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Your strengths
                  </h2>
                  <p className="text-xs text-slate-500">
                    What you demonstrated well
                  </p>
                </div>
              </div>

              <ul className="space-y-3">
                {feedback.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-emerald-50/60 p-4"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      ✓
                    </span>
                    <p className="text-sm leading-6 text-slate-700">
                      {strength}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl">
                  ↗
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Areas for improvement
                  </h2>
                  <p className="text-xs text-slate-500">
                    Opportunities to strengthen your answers
                  </p>
                </div>
              </div>

              <ul className="space-y-3">
                {feedback.areas_for_improvement.map((area, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-amber-50/60 p-4"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      !
                    </span>
                    <p className="text-sm leading-6 text-slate-700">
                      {area}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Next steps */}
          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl">
                🚀
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Your recommended next steps
                </h2>
                <p className="text-xs text-slate-500">
                  Practical actions for your next practice session
                </p>
              </div>
            </div>

            <ol className="space-y-3">
              {feedback.next_steps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-slate-700">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      {/* No submitted responses */}
      {answered === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mb-3 text-3xl">📝</div>
          <h2 className="text-base font-semibold text-slate-900">
            No responses submitted
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            You ended this practice session without submitting an answer.
            Complete at least one question to receive personalised AI feedback.
          </p>
        </div>
      )}

      {/* AI disclaimer */}
      <AIDisclaimer
        text={
          answered === 0
            ? "No personalised AI feedback was generated because no interview responses were submitted."
            : feedback
              ? "This feedback was generated by AI from your submitted interview responses. AI-generated feedback may be incomplete or inaccurate, so review the recommendations critically. This platform does not predict interview success or guarantee employment outcomes."
              : "Personalised AI feedback is currently unavailable. Your interview responses have been submitted, but no AI feedback is available to display."
        }
      />

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
        <Btn onClick={onPracticeAgain} size="md">
          Practice again
        </Btn>
        <Btn onClick={onDashboard} variant="secondary" size="md">
          Return to Dashboard
        </Btn>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────
   SCREEN 10 — Progress
───────────────────────────────────────── */

function ProgressScreen({ userId }: { userId: number }) {
  const [tab, setTab] = useState<"resume" | "interview" | "job">("resume");
  const [activity, setActivity] = useState<ActivityState>(EMPTY_ACTIVITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/user-progress.php",
          { credentials: "include" }
        );

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
          throw new Error(data.message || "Unable to retrieve progress.");
        }

        if (!cancelled) {
          setActivity({
            resumeReviews: data.resumeReviews ?? [],
            interviewSessions: data.interviewSessions ?? [],
            jobMatches: data.jobMatches ?? [],
            currentInterviewAnswered: 0,
            currentInterviewTotal: 0,
          });
        }
      } catch (err) {
        console.error("Unable to load progress:", err);
        if (!cancelled) {
          setError("Unable to load your progress. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const resumes = activity.resumeReviews;
  const interviews = activity.interviewSessions;
  const matches = activity.jobMatches;

  const completedInterviews = interviews.filter(
    (session) => session.status === "completed"
  ).length;

  const endedEarly = interviews.filter(
    (session) => session.status === "ended_early"
  ).length;

  const questionsAnswered = interviews.reduce(
    (sum, session) => sum + session.questionsAnswered,
    0
  );

  const formatDate = (value: string) => {
    if (!value) return "Date unavailable";
    const date = new Date(value.replace(" ", "T"));
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const statusLabel = (status: string) => {
    if (status === "completed") return "Completed";
    if (status === "ended_early") return "Ended early";
    if (status === "in_progress") return "In progress";
    return status.replace(/_/g, " ");
  };

  const statusStyle = (status: string) => {
    if (status === "completed")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "ended_early")
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const tabs = [
    { id: "resume", label: "Resume Activity", count: resumes.length },
    { id: "interview", label: "Interview Practice", count: interviews.length },
    { id: "job", label: "Job Matching", count: matches.length },
  ] as const;

  return (
    <div className="py-8 px-4 sm:px-8 max-w-6xl mx-auto space-y-7">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 sm:p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-100 mb-2">
          Career preparation overview
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          My Progress
        </h1>
        <p className="text-sm text-indigo-100 max-w-2xl leading-relaxed">
          Review your resume submissions, interview practice and job matching
          activity in one place. Your history is retrieved from your account.
        </p>
      </div>

      {loading && (
        <Card className="p-5">
          <p className="text-sm text-slate-500">Loading your progress...</p>
        </Card>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Resumes submitted",
                value: resumes.length,
                detail: "Saved resume submissions",
                accent: "text-indigo-600",
              },
              {
                label: "Interview sessions",
                value: interviews.length,
                detail: `${completedInterviews} completed · ${endedEarly} ended early`,
                accent: "text-violet-600",
              },
              {
                label: "Job match analyses",
                value: matches.length,
                detail: "Saved AI job comparisons",
                accent: "text-purple-600",
              },
            ].map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-sm font-medium text-slate-500 mb-3">
                  {stat.label}
                </p>
                <p className={`text-4xl font-bold tracking-tight ${stat.accent}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  {stat.detail}
                </p>
              </Card>
            ))}
          </div>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Your activity at a glance
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-xs font-medium text-indigo-700">
                  Resume submissions
                </p>
                <p className="text-2xl font-bold text-indigo-900 mt-2">
                  {resumes.length}
                </p>
              </div>

              <div className="rounded-xl bg-violet-50 p-4">
                <p className="text-xs font-medium text-violet-700">
                  Interview questions answered
                </p>
                <p className="text-2xl font-bold text-violet-900 mt-2">
                  {questionsAnswered}
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-4">
                <p className="text-xs font-medium text-purple-700">
                  Job comparisons
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-2">
                  {matches.length}
                </p>
              </div>
            </div>
          </Card>

          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Activity history
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Explore your saved activity across the platform.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Activity history categories"
              className="flex flex-wrap gap-2 mb-5"
            >
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    tab === item.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  {item.label}
                  <span className="ml-2 opacity-75">({item.count})</span>
                </button>
              ))}
            </div>

            {tab === "resume" && (
              <div role="tabpanel" className="space-y-3">
                {resumes.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-sm text-slate-500">
                      No resume submissions yet.
                    </p>
                  </Card>
                ) : (
                  resumes.map((resume) => (
                    <Card key={resume.resume_id} className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {resume.role || "Role not specified"}
                          </p>
                          <p className="text-sm text-slate-500 mt-1 break-words">
                            {resume.file}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatDate(resume.date)}
                          </p>
                        </div>
                        <span className="self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                          {resume.input_method === "paste"
                            ? "Pasted resume"
                            : "Uploaded file"}
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {tab === "interview" && (
              <div role="tabpanel" className="space-y-3">
                {interviews.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-sm text-slate-500">
                      No interview practice sessions yet.
                    </p>
                  </Card>
                ) : (
                  interviews.map((session) => (
                    <Card key={session.session_id} className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {session.role || "Role not specified"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(session.date)}
                          </p>
                          <p className="text-sm text-slate-600 mt-3">
                            <span className="font-semibold text-slate-900">
                              {session.questionsAnswered}
                            </span>{" "}
                            of {session.total} questions answered
                          </p>
                        </div>
                        <span
                          className={`self-start rounded-full border px-3 py-1 text-xs font-medium ${statusStyle(
                            session.status
                          )}`}
                        >
                          {statusLabel(session.status)}
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {tab === "job" && (
              <div role="tabpanel" className="space-y-3">
                {matches.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-sm text-slate-500">
                      No job matching analyses yet.
                    </p>
                  </Card>
                ) : (
                  matches.map((match) => (
                    <Card key={match.analysis_id} className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {match.role || "Role not specified"}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {match.company}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatDate(match.date)} ·{" "}
                            {match.inputMethod === "url"
                              ? "Job URL"
                              : "Pasted job advertisement"}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-3xl font-bold text-indigo-600">
                            {match.matchScore === null
                              ? "N/A"
                              : `${Math.round(match.matchScore)}%`}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            AI-estimated alignment
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Understanding your progress
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              These statistics describe your recorded activity within this
              platform. Resume submissions do not necessarily indicate
              completed AI feedback. Interview statuses are shown as stored,
              independently of the number of questions answered. Job alignment
              percentages are AI-generated estimates, not hiring probabilities.
              Activity totals do not measure overall career readiness or
              guarantee employment outcomes.
            </p>
          </div>
        </>
      )}
    </div>
  );
}


/* ─────────────────────────────────────────
   Job Match Analysis Engine
───────────────────────────────────────── */
interface JobMatchResult {
  targetRole: string;
  company: string;
  matchPercent: number;
  strengths: string[];
  missing: string[];
  keywords: string[];
  improvements: string[];
}

/* ─────────────────────────────────────────
   SCREEN 11a — Job Match Input
───────────────────────────────────────── */
interface StoredResume {
  resume_id: number;
  input_method: string;
  file_name: string | null;
  target_role: string;
  uploaded_at: string;
}

function JobMatchInputScreen({
  userId,
  onAnalyse,
}: {
  userId: number;
  onAnalyse: (jobText: string, jobUrl: string, resumeId: number) => void;
}) {
  const [inputMode, setInputMode] = useState<"paste" | "url">("paste");
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResumes = async () => {
      try {

const response = await fetch(
  "/api/user-resumes.php",
  {
    credentials: "include",
  }
);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to retrieve resumes.");
        }

        setResumes(data.resumes ?? []);
      } catch (err) {
        console.error("Unable to load resumes:", err);
        setError("Unable to load your saved resumes. Please try again.");
      } finally {
        setLoadingResumes(false);
      }
    };

    loadResumes();
  }, [userId]);

 const hasJobText = jobText.trim().length > 20;

const hasJobUrl = (() => {
  try {
    const url = new URL(jobUrl.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
})();

const hasResume = selectedResumeId !== null;

const hasJobInput =
  inputMode === "paste" ? hasJobText : hasJobUrl;

const canAnalyse = hasJobInput && hasResume;

const handleAnalyse = () => {
  setError("");

  if (!hasJobInput) {
    setError(
      inputMode === "url"
        ? "Please enter a valid job advertisement URL."
        : "Please paste the job advertisement text."
    );
    return;
  }

  if (selectedResumeId === null) {
    setError("Please select one of your saved resumes.");
    return;
  }

  onAnalyse(
    inputMode === "paste" ? jobText.trim() : "",
    inputMode === "url" ? jobUrl.trim() : "",
    selectedResumeId
  );
};


  return (
    <div className="py-8 px-4 sm:px-8 max-w-6xl mx-auto space-y-7">
      {/* Page header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 sm:p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-100 mb-2">
          Career preparation tools
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Match Your Resume to a Job
        </h1>
        <p className="text-sm text-indigo-100 max-w-2xl leading-relaxed">
          Compare your resume with a real job advertisement, identify
          relevant strengths and discover opportunities to improve your
          application.
        </p>
      </div>

      {/* Steps overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { number: "01", title: "Add a job", detail: "Paste text or provide a URL" },
          { number: "02", title: "Select a resume", detail: "Choose a saved resume" },
          { number: "03", title: "Analyse match", detail: "Review AI-generated feedback" },
        ].map((step) => (
          <div
            key={step.number}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
              {step.number}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {step.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            1
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Job Advertisement
            </h2>
            <p className="text-sm text-slate-500">
              Choose how you want to provide the job requirements.
            </p>
          </div>
        </div>

        <Card className="p-5 sm:p-6">
          {/* Input mode selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setInputMode("paste")}
              aria-pressed={inputMode === "paste"}
              className={`rounded-xl border p-4 text-left transition-colors ${
                inputMode === "paste"
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-indigo-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  Paste Job Advertisement
                </span>
                <span className={inputMode === "paste" ? "text-indigo-600" : "text-slate-300"}>
                  {inputMode === "paste" ? "●" : "○"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Copy and paste the full job description.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setInputMode("url")}
              aria-pressed={inputMode === "url"}
              className={`rounded-xl border p-4 text-left transition-colors ${
                inputMode === "url"
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-indigo-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  Job Advertisement Link
                </span>
                <span className={inputMode === "url" ? "text-indigo-600" : "text-slate-300"}>
                  {inputMode === "url" ? "●" : "○"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Provide a public job advertisement URL.
              </p>
            </button>
          </div>

          {inputMode === "paste" ? (
            <div>
              <label
                htmlFor="job-advertisement-text"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Job description
              </label>
              <textarea
                id="job-advertisement-text"
                rows={10}
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the job title, responsibilities, required skills and qualifications here..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              />
              <div className="flex flex-wrap justify-between gap-2 mt-2">
                <p className="text-xs text-slate-500">
                  Include the full advertisement for a more useful comparison.
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {jobText.trim()
                    ? `${jobText.trim().split(/\s+/).length} words`
                    : "0 words"}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="job-advertisement-url"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Job advertisement URL
              </label>
              <input
                id="job-advertisement-url"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://www.example.com/job-advertisement"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-indigo-900 mb-1">
                  How URL matching works
                </p>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  The application attempts to retrieve the job description
                  from the public URL. Some websites restrict automated
                  access. If retrieval fails, switch to the paste option.
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100">
            <a
              href="https://www.seek.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Find jobs on SEEK (external website)
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </Card>
      </section>

      {/* Step 2 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            2
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Select Your Resume
            </h2>
            <p className="text-sm text-slate-500">
              Choose the saved resume you want to compare.
            </p>
          </div>
        </div>

        {loadingResumes ? (
          <Card className="p-6">
            <p className="text-sm text-slate-500">
              Loading your saved resumes...
            </p>
          </Card>
        ) : resumes.length === 0 ? (
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900">
              No saved resumes found
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Submit a resume through Resume Feedback before using Job Matching.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resumes.map((resume) => {
              const selected = selectedResumeId === resume.resume_id;

              return (
                <button
                  key={resume.resume_id}
                  type="button"
                  onClick={() => setSelectedResumeId(resume.resume_id)}
                  aria-pressed={selected}
                  className={`w-full rounded-xl border p-5 text-left transition-all ${
                    selected
                      ? "border-indigo-400 bg-indigo-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {resume.target_role || "Untitled resume"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 break-words">
                        {resume.file_name ?? "Pasted resume"}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                        selected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                    <span className="text-xs text-slate-400">
                      Added{" "}
                      {new Date(
                        resume.uploaded_at.replace(" ", "T")
                      ).toLocaleDateString("en-AU")}
                    </span>

                    {selected && (
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Step 3 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            3
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Analyse Your Job Match
            </h2>
            <p className="text-sm text-slate-500">
              Generate personalised feedback on resume-to-job alignment.
            </p>
          </div>
        </div>

        <Card className="p-5 sm:p-6">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleAnalyse}
            disabled={!canAnalyse}
            className={`w-full rounded-xl px-5 py-3.5 text-sm font-semibold transition-all ${
              canAnalyse
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:from-indigo-700 hover:to-purple-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {canAnalyse
              ? "Analyse Job Match →"
              : "Add a job advertisement and select a resume to continue"}
          </button>

          <p className="text-xs text-center text-slate-500 mt-3 leading-relaxed">
            AI-generated alignment is an estimate, not a guarantee of
            interview selection or employment.
          </p>
        </Card>
      </section>
    </div>
  );

}

/* ─────────────────────────────────────────
   SCREEN 11b — Job Match Analysing
───────────────────────────────────────── */
function JobMatchAnalysingScreen({ onDone }: { onDone: () => void }) {
  const analysisStartedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const STEPS = ["Reading job advertisement…", "Identifying role requirements…", "Comparing with your resume…", "Calculating skill alignment…", "Generating recommendations…", "Analysis complete"];
  const [step, setStep] = useState(0);
  useEffect(() => {
  const iv = setInterval(() => {
    setProgress((p) => {
      const next = p + 2;

      if (next >= 100) {
        clearInterval(iv);
       if (!analysisStartedRef.current) {
  analysisStartedRef.current = true;
  setTimeout(onDone, 300);
}
        return 100;
      }

      return next;
    });
  }, 60);

  const sv = setInterval(() => {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, 650);

  return () => {
    clearInterval(iv);
    clearInterval(sv);
  };
}, [onDone]);

  return (
    <div className="py-8 px-8 max-w-md mx-auto text-center flex flex-col items-center justify-center min-h-[calc(100vh-56px)]">
      <div className="size-20 rounded-2xl bg-[#eef2ff] flex items-center justify-center text-4xl mb-8">🎯</div>
      <h1 className="text-xl font-semibold text-[#0f172a] mb-3 tracking-tight">Analysing your resume against the job requirements…</h1>
      <p className="text-sm text-[#64748b] mb-10 leading-relaxed max-w-xs">Please wait while we compare your resume with the advertised role requirements.</p>
      <div className="w-full bg-[#f1f5f9] rounded-full h-2 mb-4 overflow-hidden">
        <div className="h-2 rounded-full bg-[#4f46e5] transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-[#64748b] h-4">{STEPS[step]}</p>
      <p className="text-xs text-[#94a3b8] mt-1">{Math.round(progress)}%</p>
      <AIDisclaimer text="Preparing the job match request. AI-generated results will only be displayed when the external AI service successfully completes the analysis." />
    </div>
  );
}

/* ─────────────────────────────────────────
   SCREEN 11c — Job Match Results
───────────────────────────────────────── */

function JobMatchResultsScreen({
  result,
  onImproveResume,
  onPracticeInterview,
  onAnalyseAnother,
}: {
  result: JobMatchResult;
  onImproveResume: (role: string) => void;
  onPracticeInterview: (role: string) => void;
  onAnalyseAnother: () => void;
}) {
  const pct = Math.min(100, Math.max(0, result.matchPercent));
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - pct / 100);

  const scoreColor =
    pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#f87171";

  const scoreLabel =
    pct >= 70
      ? "Stronger alignment"
      : pct >= 50
      ? "Partial alignment"
      : "Limited alignment";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#6366f1]">
            AI Career Readiness Assistant
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">
            Job Match Analysis
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Understand how your resume aligns with this opportunity.
          </p>
        </div>

        <Btn onClick={onAnalyseAnother} variant="secondary" size="sm">
          Analyse Another Job
        </Btn>
      </div>

      {/* Main summary */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#4338ca] via-[#4f46e5] to-[#7c3aed] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold">
              AI-generated career guidance
            </span>

            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-indigo-100">
              Target position
            </p>
            <h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl">
              {result.targetRole}
            </h2>
            <p className="mt-2 text-sm text-indigo-100">
              {result.company}
            </p>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-indigo-100">
              Your resume has been compared with the job advertisement
              to identify relevant experience, evidence gaps and
              opportunities to improve your application.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center rounded-2xl border border-white/20 bg-white/10 px-6 py-5">
            <div className="relative h-32 w-32">
              <svg
                viewBox="0 0 112 112"
                className="h-full w-full"
                role="img"
                aria-label={`AI resume-job alignment score: ${pct}%`}
              >
                <circle
                  cx="56"
                  cy="56"
                  r="42"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="10"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="42"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 56 56)"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{pct}%</span>
                <span className="text-[10px] text-indigo-100">
                  alignment
                </span>
              </div>
            </div>

            <p className="mt-3 text-sm font-semibold">
              Resume–Job Alignment
            </p>
            <p className="mt-1 text-xs text-indigo-100">
              {scoreLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Score explanation */}
      <div className="mb-6 rounded-xl border border-[#c7d2fe] bg-[#eef2ff] px-5 py-4">
        <p className="text-sm font-semibold text-[#312e81]">
          What does this score mean?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#4338ca]">
          This indicative AI-generated score describes the alignment
          between the evidence in your resume and the job requirements.
          It is not a hiring probability, employer assessment or
          guarantee of interview selection.
        </p>
      </div>

      {/* Strengths and gaps */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
              ✓
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Matching Strengths
              </h2>
              <p className="text-xs text-[#64748b]">
                Relevant experience identified in your resume
              </p>
            </div>
          </div>

          {result.strengths.length > 0 ? (
            <div className="space-y-3">
              {result.strengths.map((strength, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"
                >
                  <span className="mt-0.5 shrink-0 text-sm font-bold text-emerald-600">
                    ✓
                  </span>
                  <p className="text-sm leading-relaxed text-[#334155]">
                    {strength}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">
              No clear matching strengths were identified.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600">
              !
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Missing or Weak Areas
              </h2>
              <p className="text-xs text-[#64748b]">
                Requirements needing stronger evidence
              </p>
            </div>
          </div>

          {result.missing.length > 0 ? (
            <div className="space-y-3">
              {result.missing.map((gap, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3"
                >
                  <span className="mt-0.5 shrink-0 text-sm font-bold text-amber-600">
                    !
                  </span>
                  <p className="text-sm leading-relaxed text-[#334155]">
                    {gap}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">
              No specific evidence gaps were identified.
            </p>
          )}
        </Card>
      </div>

      {/* Keywords */}
      <Card className="mb-6 p-6">
        <h2 className="text-base font-bold text-[#0f172a]">
          Important Job Keywords
        </h2>
        <p className="mt-1 text-sm text-[#64748b]">
          Consider using these terms only where your actual skills
          and experience support them.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {result.keywords.length > 0 ? (
            result.keywords.map((keyword, index) => (
              <span
                key={`${keyword}-${index}`}
                className="rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-[#4338ca]"
              >
                {keyword}
              </span>
            ))
          ) : (
            <p className="text-sm text-[#64748b]">
              No specific keywords were identified.
            </p>
          )}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="mb-6 p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-[#0f172a]">
            Personalised Resume Improvements
          </h2>
          <p className="mt-1 text-sm text-[#64748b]">
            Practical recommendations to strengthen your application.
          </p>
        </div>

        {result.improvements.length > 0 ? (
          <div className="space-y-3">
            {result.improvements.map((improvement, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-sm font-bold text-[#4f46e5]">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm leading-relaxed text-[#334155]">
                  {improvement}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#64748b]">
            No additional resume improvements were identified.
          </p>
        )}
      </Card>

      {/* Responsible AI */}
      <div className="mb-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
        <p className="text-sm font-semibold text-[#0f172a]">
          Responsible AI & Human Oversight
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#64748b]">
          AI-generated recommendations may be incomplete or inaccurate.
          Review the original job advertisement, verify suggestions
          against your real experience and consult a career adviser
          when needed. Do not add qualifications or experience you
          do not possess.
        </p>
      </div>

      {/* Next steps */}
      <div className="rounded-2xl border border-[#c7d2fe] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0f172a]">
          Continue Your Career Preparation
        </h2>
        <p className="mt-2 text-sm text-[#64748b]">
          Turn your job match insights into practical next steps.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Btn
            onClick={() => onImproveResume(result.targetRole)}
            size="sm"
            full
          >
            Improve Resume for This Role →
          </Btn>

          <Btn
            onClick={() => onPracticeInterview(result.targetRole)}
            variant="secondary"
            size="sm"
            full
          >
            Practise Interview for This Role →
          </Btn>
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────
   SCREEN 11 — Responsible AI & Privacy
───────────────────────────────────────── */

function ResponsibleAIScreen() {
  const [open, setOpen] = useState<number | null>(null);

  const principles = [
    {
      icon: "⚖️",
      title: "Fairness",
      description:
        "The platform is designed to evaluate career preparation content rather than personal characteristics. AI-generated recommendations may still contain bias, so users should review them critically.",
    },
    {
      icon: "🔍",
      title: "Transparency",
      description:
        "AI is used for resume feedback, interview preparation and job matching. Results are intended to support career preparation, not make recruitment decisions.",
    },
    {
      icon: "🔒",
      title: "Privacy",
      description:
        "Career preparation information is stored to support platform features. Relevant submitted content is also transmitted to an external AI provider when AI-powered features are used.",
    },
    {
      icon: "👤",
      title: "Human Oversight",
      description:
        "Users remain responsible for reviewing AI suggestions. Important career decisions should also consider trusted information and advice from qualified career professionals.",
    },
  ];

  const aiFeatures = [
    {
      number: "01",
      title: "Resume Feedback",
      description:
        "The target role and submitted resume content are sent to OpenAI to generate personalised feedback on strengths and areas for improvement.",
    },
    {
      number: "02",
      title: "Interview Preparation",
      description:
        "Role and interview preferences are used to generate practice questions. Submitted interview responses and session configuration are used to generate personalised feedback.",
    },
    {
      number: "03",
      title: "Job Matching",
      description:
        "Resume content and job advertisement information are compared using AI. The resulting alignment percentage is an estimate of how the submitted materials compare, not a prediction of hiring success.",
    },
  ];

  const dataCategories = [
    {
      title: "Account information",
      description:
        "Account details, including your email address and profile information, are stored to support authentication and account management.",
    },
    {
      title: "Resume information",
      description:
        "Submitted resumes, target roles and related career preparation records are stored. Resume content may contain personal information that you include.",
    },
    {
      title: "Interview activity",
      description:
        "Interview configurations, questions, submitted responses, session statuses and generated feedback may be stored as part of your practice history.",
    },
    {
      title: "Job Matching activity",
      description:
        "Submitted job advertisements, selected resume references and generated matching analyses are stored to support job comparison features.",
    },
  ];

  const limitations = [
    "AI can produce inaccurate, incomplete, biased or inappropriate recommendations.",
    "Generated feedback should be checked against reliable career information and actual job requirements.",
    "A job alignment percentage does not represent the probability of receiving an interview or job offer.",
    "The platform does not assess personality, determine employability or make recruitment decisions.",
    "When an AI request fails or returns an unusable result, the application is designed to display an error rather than fabricate successful AI feedback.",
    "AI feedback should not be the sole basis for important career decisions.",
  ];

  const faqs = [
    {
      question: "Does the platform send my information to OpenAI?",
      answer:
        "Yes. When you use an AI-powered feature, the PHP backend sends the relevant input to OpenAI. This can include resume content, target roles, interview preferences, submitted interview responses and job advertisement text, depending on the feature. Avoid including unnecessary sensitive personal information.",
    },
    {
      question: "Is my information stored in the application?",
      answer:
        "Yes. The application uses a database to store account information and career preparation records, including submitted resumes, interview activity and job matching analyses. These records support the application's features and activity history.",
    },
    {
      question: "Can I delete my account or export all my data?",
      answer:
        "The current MVP provides account and password management features. Self-service account deletion and a complete personal data export feature have not been implemented as verified user-facing controls. Do not assume that logging out deletes stored information.",
    },
    {
      question: "Does OpenAI retain submitted information?",
      answer:
        "Submitted information is processed by OpenAI as an external service. Provider-side storage and retention are separate from this application's database. The current integration does not explicitly disable Responses API storage. Applicable provider data handling and retention practices should be reviewed before submitting sensitive information.",
    },
    {
      question: "Can AI-generated results be inaccurate or biased?",
      answer:
        "Yes. Generative AI can produce errors, overlook relevant experience or generate recommendations that do not suit an individual's circumstances. Users should independently review results and seek professional advice when appropriate.",
    },
    {
      question: "Does a high Job Matching score guarantee employment?",
      answer:
        "No. The percentage is an AI-generated estimate of alignment between a submitted resume and job advertisement. It does not predict hiring outcomes or guarantee an interview, offer or employment.",
    },
    {
      question: "What happens if the AI service is unavailable?",
      answer:
        "The backend includes error handling for unavailable services and invalid AI responses. The application is designed to report a failure rather than display invented AI-generated feedback as a successful result.",
    },
    {
      question: "Which responsible AI frameworks inform the platform?",
      answer:
        "The platform draws on principles from the NIST AI Risk Management Framework, Australian Privacy Principles and Australian AI Ethics Principles. These are design references, not a claim of formal certification or demonstrated legal compliance.",
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-8 max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 sm:p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-100 mb-2">
          Trust, transparency and accountability
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Responsible AI &amp; Privacy
        </h1>
        <p className="text-sm text-indigo-100 max-w-2xl leading-relaxed">
          Understand how AI supports your career preparation, what
          information is processed and why human judgement remains important.
        </p>
      </div>

      {/* Principles */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Our responsible AI principles
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Principles guiding the design of this career preparation platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {principles.map((principle) => (
            <Card key={principle.title} className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl" aria-hidden="true">
                  {principle.icon}
                </span>
                <h3 className="font-semibold text-slate-900">
                  {principle.title}
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {principle.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* AI features */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          How AI is used
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiFeatures.map((feature) => (
            <Card key={feature.number} className="p-5">
              <span className="text-sm font-bold text-indigo-600">
                {feature.number}
              </span>
              <h3 className="font-semibold text-slate-900 mt-3 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Data handling */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Your information and privacy
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Information handled by the application to provide its features.
        </p>

        <Card className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {dataCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {category.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <h3 className="text-sm font-semibold text-indigo-900 mb-2">
              External AI processing
            </h3>
            <p className="text-sm text-indigo-900 leading-relaxed">
              Relevant information is transmitted from the PHP backend to
              OpenAI when an AI-powered feature is used. The application
              stores career preparation records separately in its database.
              The current integration does not explicitly disable provider
              response storage. Avoid submitting unnecessary sensitive
              information.
            </p>
          </div>
        </Card>
      </section>

      {/* Limitations */}
      <section>
        <Card className="p-5 sm:p-6 border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl" aria-hidden="true">⚠️</span>
            <h2 className="text-lg font-semibold text-slate-900">
              Important AI limitations
            </h2>
          </div>

          <ul className="space-y-3">
            {limitations.map((limitation) => (
              <li
                key={limitation}
                className="flex items-start gap-3 text-sm text-amber-900"
              >
                <span className="text-amber-500 shrink-0">•</span>
                <span className="leading-relaxed">{limitation}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* FAQs */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Frequently asked questions
        </h2>

        <Card className="p-4 sm:p-5">
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={open === index}
                  onClick={() =>
                    setOpen(open === index ? null : index)
                  }
                  className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {faq.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`text-slate-400 transition-transform ${
                      open === index ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {open === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Final notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-xs text-slate-600 leading-relaxed">
          Informed by the NIST AI Risk Management Framework,
          Australian Privacy Principles and Australian AI Ethics Principles.
          This platform provides career preparation support, not recruitment
          decisions or guaranteed employment outcomes. It does not replace
          professional career advice.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Activity state types
───────────────────────────────────────── */
interface ResumeHistoryEntry {
  resume_id: number;
  date: string;
  role: string;
  file: string;
  input_method: string;
}

interface InterviewHistoryEntry {
  session_id: number;
  date: string;
  role: string;
  questionsAnswered: number;
  total: number;
  status: string;
  completed_at: string | null;
}
interface JobMatchHistoryEntry {
  analysis_id: number;
  job_ad_id: number;
  resume_id: number;
  date: string;
  role: string;
  company: string;
  matchScore: number | null;
  inputMethod: string;
}
interface ActivityState {
  resumeReviews: ResumeHistoryEntry[];
  interviewSessions: InterviewHistoryEntry[];
  jobMatches: JobMatchHistoryEntry[];
  currentInterviewAnswered: number;
  currentInterviewTotal: number;
}
const EMPTY_ACTIVITY: ActivityState = {
  resumeReviews: [],
  interviewSessions: [],
  jobMatches: [],
  currentInterviewAnswered: 0,
  currentInterviewTotal: 0,
};

/* ─────────────────────────────────────────
   Root App
───────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [checkingSession, setCheckingSession] = useState(true);
 const navigate = useNavigate();
const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
  if (window.location.pathname === "/reset-password") {
    setScreen("reset-password");
    setCheckingSession(false);
    return;
  }

  try {
        const response = await fetch("/api/me.php", {
  credentials: "include",
  signal: AbortSignal.timeout(10000),
});

        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled && data.status === "success" && data.user) {
          setUserId(Number(data.user.user_id));
          setUserName(data.user.preferred_name);
          setUserEmail(data.user.email);
          const requestedScreen = (
  Object.entries(SCREEN_PATHS) as [Screen, string][]
).find(([, path]) => path === window.location.pathname)?.[0];

const safeScreens: Screen[] = [
  "dashboard",
  "resume-upload",
  "interview-setup",
  "job-match-input",
  "progress",
  "responsible-ai",
];

const restoredScreen =
  requestedScreen && safeScreens.includes(requestedScreen)
    ? requestedScreen
    : "dashboard";

setScreen(restoredScreen);

const restoredPath = SCREEN_PATHS[restoredScreen];
if (restoredPath && window.location.pathname !== restoredPath) {
  navigate(restoredPath, { replace: true });
}
        }
      } catch (error) {
        console.error("Session restoration failed:", error);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("Mei");
  const [userEmail, setUserEmail] = useState("mei.zhang@student.edu.au");
  const [interviewConfig, setInterviewConfig] = useState({ role: "Software Developer", industry: "Technology", type: "Behavioural", difficulty: "Intermediate", count: 5 });
  const [sessionQuestions, setSessionQuestions] = useState<IQ[]>([]);
  const [interviewSessionId, setInterviewSessionId] = useState<number | null>(null);

const [interviewAIFeedback, setInterviewAIFeedback] =
  useState<InterviewAIFeedback | null>(null);
const [interviewEndStatus, setInterviewEndStatus] =
  useState<"completed" | "ended_early">("completed");
const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [completedQs, setCompletedQs] = useState(0);
  const [resumeFeedback, setResumeFeedback] = useState<ResumeFeedback | null>(null);
  const [activity, setActivity] = useState<ActivityState>(EMPTY_ACTIVITY);
const [activityLoading, setActivityLoading] = useState(false);
const [activityError, setActivityError] = useState<string | null>(null);
  const [jobMatchResult, setJobMatchResult] = useState<JobMatchResult | null>(null);
  const [jobMatchError, setJobMatchError] = useState<string | null>(null);
 const [pendingJobMatch, setPendingJobMatch] = useState<{
  
  jobText: string;
  jobUrl: string;
  resumeId: number;
  jobAdId?: number;
} | null>(null); 
useEffect(() => {
  if (!userId) {
    setActivity(EMPTY_ACTIVITY);
    setActivityLoading(false);
    setActivityError(null);
    return;
  }

  setActivityLoading(true);
  setActivityError(null);

  const loadPersistedActivity = async () => {
    try {
      const response = await fetch("/api/user-progress.php", {
          credentials: "include",
        });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to retrieve progress information."
        );
      }
setActivity({
  resumeReviews: data.resumeReviews ?? [],
  interviewSessions: data.interviewSessions ?? [],
  jobMatches: data.jobMatches ?? [],
  currentInterviewAnswered: 0,
  currentInterviewTotal: 0,
});
      
    } catch (error) {
  console.error("Unable to load dashboard activity:", error);
  setActivityError(
    error instanceof Error
      ? error.message
      : "Unable to load your progress. Please try again."
  );
} finally {
  setActivityLoading(false);
}
  };

  loadPersistedActivity();
}, [userId]);

const resetActivity = () => {
  setActivity(EMPTY_ACTIVITY);
  setResumeFeedback(null);
  setJobMatchResult(null);
  setPendingJobMatch(null);
  setSessionQuestions([]);
  setQIndex(0);
  setCompletedQs(0);
  setCurrentAnswer("");
};

  const go = (s: Screen) => {
  setScreen(s);

  const path = SCREEN_PATHS[s];

  if (path && location.pathname !== path) {
    navigate(path);
  }

  window.scrollTo(0, 0);
};


useEffect(() => {
  if (checkingSession) return;

  // 1. Reset Password screen (public)
  if (location.pathname === "/reset-password") {
    setScreen("reset-password");
    return;
  }

  // 2. Sign In screen (public)
  if (location.pathname === "/login") {
    setScreen("auth");
    return;
  }

  // 3. Landing page (public)
  if (location.pathname === "/") {
    if (!userId) {
      setScreen("landing");
      return;
    }

    setScreen("dashboard");
    navigate("/dashboard", { replace: true });
    return;
  }

  // 4. Protect private pages
  if (!userId) {
    setScreen("auth");
    navigate("/login", { replace: true });
    return;
  }

  // 5. Find the screen matching the current URL
  const requestedScreen = (
    Object.entries(SCREEN_PATHS) as [Screen, string][]
  ).find(([, path]) => path === location.pathname)?.[0];

  // 6. Screens that can be opened directly through URLs
  const safeScreens: Screen[] = [
    "dashboard",
    "resume-upload",
    "interview-setup",
    "job-match-input",
    "progress",
    "responsible-ai",
  ];

  // 7. Update screen and sidebar navigation
  if (requestedScreen && safeScreens.includes(requestedScreen)) {
    setScreen(requestedScreen);

    const navMap: Partial<Record<Screen, NavItem>> = {
      dashboard: "dashboard",
      "resume-upload": "resume",
      "interview-setup": "interview",
      "job-match-input": "job-matching",
      progress: "progress",
      "responsible-ai": "responsible-ai",
    };

    const navItem = navMap[requestedScreen];

    if (navItem) {
      setActiveNav(navItem);
    }
  }
}, [location.pathname, checkingSession, userId, navigate]);



const completeInterviewSession = async (
  sessionStatus: "completed" | "ended_early" = "completed",
  answeredCount: number = completedQs
) => {
  const actualStatus: "completed" | "ended_early" =
    sessionStatus === "ended_early" ||
    answeredCount < interviewConfig.count
      ? "ended_early"
      : "completed";

  setInterviewEndStatus(actualStatus);

  if (!interviewSessionId) {
    console.error("No active interview session ID found.");
    go("interview-summary");
    return;
  }

  try {
    const response = await fetch(
      "/api/interview-complete.php",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: interviewSessionId,
          session_status: actualStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        data.message || "Unable to complete interview session."
      );

      // The student can still view the local summary.
      go("interview-summary");
      return;
    }

   console.log("Interview session completed:", data.session_id);

// If no responses were submitted, do not request personalised AI feedback.
if (completedQs === 0) {
  setInterviewAIFeedback(null);
  go("interview-summary");
  return;
}

// Show a loading screen while personalised feedback is generated.
setInterviewAIFeedback(null);
go("interview-feedback-generating");

// Allow the loading screen to render before starting the AI request.
await new Promise<void>((resolve) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => resolve());
  });
});

const feedbackResponse = await fetch(
"/api/interview-feedback.php",
  {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: interviewSessionId,
    }),
  }
);

const feedbackData = await feedbackResponse.json();

if (!feedbackResponse.ok) {
  console.error(
    feedbackData.code || "AI_FEEDBACK_UNAVAILABLE",
    feedbackData.message || "Unable to generate interview feedback."
  );

  go("interview-feedback-error");
  return;
}

setInterviewAIFeedback(feedbackData.feedback);
go("interview-summary");
  } catch (error) {
    console.error("Interview completion request failed:", error);

    // Do not block the student from viewing their summary.
    go("interview-summary");
  }
};
  const handleNav = (n: NavItem) => {
    setActiveNav(n);
    if (n === "resume") go("resume-upload");
    else if (n === "interview") go("interview-setup");
    else if (n === "job-matching") go("job-match-input");
    else if (n === "progress") go("progress");
    else if (n === "responsible-ai") go("responsible-ai");
    else go("dashboard");
  };

  const isAppScreen =
  userId !== null &&
  screen !== "landing" &&
  screen !== "auth" &&
  screen !== "onboarding";

  // Keep nav in sync
  useEffect(() => {
    if (screen === "dashboard") setActiveNav("dashboard");
    else if (["resume-upload", "resume-analysing", "resume-results", "resume-error"].includes(screen)) setActiveNav("resume");
    else if (["interview-setup", "interview-generating", "interview-error", "interview-question", "interview-feedback-generating", "interview-feedback", "interview-feedback-error", "interview-summary"].includes(screen)) setActiveNav("interview");
    else if (["job-match-input", "job-match-analysing", "job-match-results", "job-match-error"].includes(screen)) setActiveNav("job-matching");
    else if (screen === "progress") setActiveNav("progress");
    else if (screen === "responsible-ai") setActiveNav("responsible-ai");
  }, [screen]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Restoring your session...</p>
      </div>
    );
  }
  if (screen === "reset-password") {
  return <ResetPasswordScreen />;
}
return (
  <div className="font-sans bg-[#f8fafc] min-h-screen">

    {/* Landing / Auth / Onboarding — no sidebar */}

    {screen === "landing" && (
      <LandingScreen
        onStart={() => go("auth")}
        onLearn={() => go("auth")}
      />
    )}
{screen === "auth" && (
  <>
    <div className="absolute top-5 left-5 z-10">
      <button
        type="button"
        onClick={() => go("landing")}
        className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        ← Back to Home
      </button>
    </div>

    <AuthScreen
      onSuccess={(id, name, email, isNew) => {
        resetActivity();
        setUserId(id);
        setUserName(name);
        setUserEmail(email);
        go(isNew ? "onboarding" : "dashboard");
      }}
    />
  </>
      )}
      {screen === "onboarding" && <OnboardingScreen onDone={(name) => { setUserName(name); go("dashboard"); }} />}

      {/* App screens with sidebar */}
      {isAppScreen && (
        <div className="flex flex-col md:flex-row min-h-screen">
          <Sidebar
            active={activeNav}
            onNav={handleNav}
            userId={userId!}
            userName={userName}
            userEmail={userEmail}
        onLogout={async () => {
  try {
    const response = await fetch("/api/logout.php", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout request failed");
    }

    resetActivity();
    setUserId(null);
    setUserName("");
    setUserEmail("");
    go("landing");
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Unable to log out. Please try again.");
  }
}}
            onUpdateUser={(name, email) => { setUserName(name); setUserEmail(email); }}
          />
          <main className="flex-1 min-w-0 w-full overflow-auto">
            {screen === "dashboard" && (
              <DashboardScreen
  userName={userName}
  activity={activity}
  activityLoading={activityLoading}
  activityError={activityError}
  onResumeHistory={() => {
    setActiveNav("resume");
    go("resume-history");
  }}
  onResume={() => {
    setActiveNav("resume");
    go("resume-upload");
  }}
  onInterview={() => {
    setActiveNav("interview");
    go("interview-setup");
  }}
  onJobMatch={() => {
    setActiveNav("job-matching");
    go("job-match-input");
  }}
/>
)}
{screen === "resume-history" && (
  <ResumeHistoryScreen
    resumes={activity.resumeReviews}
    onUpload={() => {
      setActiveNav("resume");
      go("resume-upload");
    }}
  />
)}
            {screen === "resume-upload" && (
              <ResumeUploadScreen onAnalyse={async (content, role, fileName) => {
  if (!userId) {
  console.error("No logged-in user ID is available.");
  go("resume-error");
  return;
}

// Show the real analysing state immediately while the API request runs.
setResumeFeedback(null);
go("resume-analysing");

try {
    const response = await fetch("/api/resume.php", {
      method: "POST",
credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
  user_id: userId,
  resume_text: content,
  target_role: role,
  input_method: fileName === "Pasted resume text" ? "paste" : "upload",
  file_name: fileName === "Pasted resume text" ? null : fileName,
}),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message || "Unable to submit resume.");
      go("resume-error");
      return;
    }

    console.log("Resume stored successfully:", data.resume_id);

    const feedbackResponse = await fetch("/api/resume-feedback.php", {
  method: "POST",
credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    resume_id: data.resume_id,
  }),
});

const feedbackData = await feedbackResponse.json();

if (!feedbackResponse.ok) {
  console.error(
    feedbackData.code || "AI_FEEDBACK_ERROR",
    feedbackData.message || "Unable to generate resume feedback."
  );
  go("resume-error");
  return;
}

const realFeedback = mapAIResumeFeedback(
  feedbackData,
  fileName
);

setResumeFeedback(realFeedback);

console.log("Real AI resume feedback received:", feedbackData);

const today = new Date().toLocaleDateString("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

setActivity((prev) => ({
  ...prev,
  resumeReviews: [
    {
      resume_id: Number(data.resume_id),
      date: today,
      role: realFeedback.targetRole,
      file: realFeedback.resumeLabel,
      input_method: fileName ? "upload" : "paste",
    },
    ...prev.resumeReviews,
  ],
}));

go("resume-results");

} catch (error) {
  console.error("Resume submission failed:", error);
  go("resume-error");
}
}} />
)}

{screen === "resume-analysing" && (
  <ResumeAnalysingScreen />
)}

{screen === "resume-error" && (
  <AIErrorScreen
    context="AI-generated resume feedback"
    onRetry={() => go("resume-upload")}
    onBack={() => go("resume-upload")}
  />
)}

{screen === "resume-results" && resumeFeedback && (
  <ResumeResultsScreen
    onBack={() => go("dashboard")}
    onUploadNew={() => go("resume-upload")}
    feedback={resumeFeedback}
  />
)}

{screen === "resume-results" && !resumeFeedback && (
  <div className="py-8 px-8 max-w-2xl mx-auto">
    <p className="text-sm text-[#64748b]">
      No resume analysis found.{" "}
      <button
        onClick={() => go("resume-upload")}
        className="text-[#4f46e5] underline"
      >
        Upload a resume
      </button>{" "}
      to get started.
    </p>
  </div>
)}
{screen === "interview-setup" && (
  <InterviewSetupScreen
    userName={userName}
    onStart={async (cfg) => {
      try {
        if (!userId) {
          console.error("No logged-in user ID is available.");
          go("interview-error");
          return;
        }
    // 1. Create the interview session in the database.
    const sessionResponse = await fetch(
      "/api/interview-session.php",
      {
        method: "POST",
credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          target_role: cfg.role,
          industry: cfg.industry,
          interview_type: cfg.type,
          difficulty_level: cfg.difficulty,
          question_count: cfg.count,
          use_career_profile: cfg.useProfile,
        }),
      }
    );

    const sessionData = await sessionResponse.json();

    if (!sessionResponse.ok) {
      console.error(
        sessionData.message || "Unable to create interview session."
      );
      go("interview-error");
      return;
    }

    const newSessionId = Number(sessionData.session_id);
    setInterviewSessionId(newSessionId);
// 2. Show the generating screen before starting the real AI request.
go("interview-generating");

// Allow React/browser to paint the generating screen first.
await new Promise<void>((resolve) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => resolve());
  });
});

// 3. Generate interview questions using the backend OpenAI service.
const aiQuestionsResponse = await fetch(
   
  "/api/interview-generate.php",
  {
    method: "POST",
credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: newSessionId,
    }),
  }
);

const aiQuestionsData = await aiQuestionsResponse.json();

if (!aiQuestionsResponse.ok) {
  console.error(
    aiQuestionsData.code || "AI_GENERATION_FAILED",
    aiQuestionsData.message || "Unable to generate interview questions."
  );
  go("interview-error");
  return;
}

const generatedQuestions: IQ[] = aiQuestionsData.questions;

// 4. Store the validated AI-generated questions against the real database session.
    const questionsResponse = await fetch(
      "/api/interview-questions.php",
      {
        method: "POST",
credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: newSessionId,
          questions: generatedQuestions,
        }),
      }
    );

    const questionsData = await questionsResponse.json();

    if (!questionsResponse.ok) {
      console.error(
        questionsData.message || "Unable to store interview questions."
      );
      go("interview-error");
      return;
    }

    const savedQuestionIds = questionsData.questions.map(
      (question: { question_id: number }) => question.question_id
    );

    setQuestionIds(savedQuestionIds);
    setInterviewConfig(cfg);
    setSessionQuestions(generatedQuestions);

    setQIndex(0);
    setCompletedQs(0);
    setCurrentAnswer("");

    setActivity((prev) => ({
      ...prev,
      currentInterviewAnswered: 0,
      currentInterviewTotal: cfg.count,
    }));

    console.log("Interview session created:", newSessionId);
    console.log("Interview question IDs:", savedQuestionIds);

    go("interview-question");
  } catch (error) {
    console.error("Interview setup request failed:", error);
    go("interview-error");
  }
}}
             
              />
            )}
            {screen === "interview-generating" && (
  <InterviewGeneratingScreen />
)}
            {screen === "interview-error" && (
              <AIErrorScreen
                context="AI-generated interview questions"
                onRetry={() => go("interview-setup")}
                onBack={() => go("interview-setup")}
              />
            )}
            {screen === "interview-question" && sessionQuestions.length > 0 && (
              <InterviewQuestionScreen
  qIndex={qIndex}
  answeredCount={completedQs}
  total={interviewConfig.count}
  question={sessionQuestions[qIndex] ?? sessionQuestions[0]}
               onSubmit={async (ans) => {
  try {
    const questionId = questionIds[qIndex];

    if (!questionId) {
      console.error("No database question ID found for the current question.");
      go("interview-error");
      return;
    }

    const response = await fetch(
      "/api/interview-response.php",
      {
        method: "POST",
        credentials: "include", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: questionId,
          response_text: ans,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        data.message || "Unable to store interview response."
      );
      go("interview-error");
      return;
    }

    setCurrentAnswer(ans);

    const newCompleted = completedQs + 1;
    setCompletedQs(newCompleted);

    setActivity((prev) => ({
      ...prev,
      currentInterviewAnswered: newCompleted,
    }));

    console.log(
      "Interview response stored:",
      data.response_id,
      "for question:",
      questionId
    );

    const next = qIndex + 1;
if (next >= interviewConfig.count) {
  completeInterviewSession("completed", newCompleted);
}
else {
  setQIndex(next);
  setCurrentAnswer("");
  go("interview-question");
}
  } catch (error) {
    console.error("Interview response request failed:", error);
    go("interview-error");
  }
}}
                onSkip={() => {
  if (qIndex + 1 >= interviewConfig.count) {
    completeInterviewSession();
  } else {
    setQIndex((i) => i + 1);
  }
}}
onEnd={() => completeInterviewSession("ended_early")}
                
              />
            )}
      {screen === "interview-feedback-generating" && (
  <InterviewFeedbackGeneratingScreen />
)}
{screen === "interview-feedback-error" && (
  <AIErrorScreen
    context="AI-generated interview feedback"
   onRetry={() => completeInterviewSession("completed")}
    onBack={() => {
      const next = qIndex + 1;

      if (next >= interviewConfig.count) {
        go("interview-summary");
      } else {
        setQIndex(next);
        setCurrentAnswer("");
        go("interview-question");
      }
    }}
  />
)}
            
            {screen === "interview-feedback" && sessionQuestions.length > 0 && (
              <InterviewFeedbackScreen
                qIndex={qIndex}
                total={interviewConfig.count}
                question={sessionQuestions[qIndex] ?? sessionQuestions[0]}
                answer={currentAnswer}
                onNext={() => {
  const next = qIndex + 1;

  if (next >= interviewConfig.count) {
    completeInterviewSession("completed");
  } else {
    setQIndex(next);
    setCurrentAnswer("");
    go("interview-question");
  }
}}
                onRetry={() => go("interview-question")}
               onEnd={() => completeInterviewSession("ended_early")}
              />
            )}
            {screen === "interview-summary" && (
              <InterviewSummaryScreen
  total={interviewConfig.count}
  completed={completedQs}
  feedback={interviewAIFeedback}
    sessionStatus={interviewEndStatus}
                onPracticeAgain={() => {
  setActivity((prev) => ({
    ...prev,
    currentInterviewAnswered: 0,
    currentInterviewTotal: 0,
  }));

  setQIndex(0);
  setCompletedQs(0);
  go("interview-setup");
}}
                onDashboard={() => {
  setActivity((prev) => ({
    ...prev,
    currentInterviewAnswered: 0,
    currentInterviewTotal: 0,
  }));

  go("dashboard");
}}
              />
            )}
            {screen === "job-match-input" && userId && (
  <JobMatchInputScreen
    userId={userId}
    onAnalyse={async (jobText, jobUrl, resumeId) => {
      try {
        const response = await fetch(
          "/api/job-advertisement.php",
          {
            method: "POST",
credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              job_ad_text: jobText,
              job_url: jobUrl,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
  console.error(
    "Unable to save job advertisement:",
    data.message
  );

  setJobMatchError(
    response.status === 422
      ? "We couldn't retrieve the job advertisement from this URL. The website may restrict automated access. Please use the Paste Job Advertisement option instead."
      : "Unable to process the job advertisement. Please check your input and try again."
  );

  setJobMatchResult(null);
  go("job-match-error");
  return;
}

        setPendingJobMatch({
          jobText,
          jobUrl,
          resumeId,
          jobAdId: data.job_ad_id,
        });

        setJobMatchResult(null);
        go("job-match-analysing");
      } catch (error) {
        console.error(
          "Unable to connect to job advertisement API:",
          error
        );
        go("job-match-error");
      }
    }}
  />
)}
        {screen === "job-match-analysing" && (
  <JobMatchAnalysingScreen
    onDone={async () => {
      if (
        !userId ||
        !pendingJobMatch?.jobAdId ||
        !pendingJobMatch.resumeId
      ) {
        console.error("Missing job match analysis data.");
        go("job-match-error");
        return;
      }

      try {
        const response = await fetch(
          "/api/job-match-analysis.php",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              job_ad_id: pendingJobMatch.jobAdId,
              resume_id: pendingJobMatch.resumeId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Job match analysis unavailable:",
            data.code,
            data.message
          );

          setJobMatchResult(null);
          go("job-match-error");
          return;
        }

        /*
         * A real JobMatchResult will be assigned here after the
         * live AI analysis service is implemented.
         */
        setJobMatchResult(data.result);
        go("job-match-results");
      } catch (error) {
        console.error(
          "Unable to connect to job match analysis API:",
          error
        );

        setJobMatchResult(null);
        go("job-match-error");
      }
    }}
  />
)}    
              
            {screen === "job-match-error" && (
  <AIErrorScreen
    context="AI-generated job match analysis"
    message={jobMatchError ?? undefined}
    onRetry={() => {
      setJobMatchError(null);
      go("job-match-input");
    }}
    onBack={() => {
      setJobMatchError(null);
      go("job-match-input");
    }}
  />
)}
            {screen === "job-match-results" && jobMatchResult && (
              <JobMatchResultsScreen
                result={jobMatchResult}
                onImproveResume={(role) => {
                  setActiveNav("resume");
                  go("resume-upload");
                }}
                onPracticeInterview={(role) => {
                  setInterviewConfig((prev) => ({ ...prev, role }));
                  setActiveNav("interview");
                  go("interview-setup");
                }}
                onAnalyseAnother={() => go("job-match-input")}
              />
            )}
            {screen === "job-match-results" && !jobMatchResult && (
              <div className="py-8 px-8 max-w-2xl mx-auto">
                <p className="text-sm text-[#64748b]">No job match analysis found. <button onClick={() => go("job-match-input")} className="text-[#4f46e5] underline">Start a new analysis</button>.</p>
              </div>
            )}
        {screen === "progress" && userId && (
  <ProgressScreen userId={userId} />
)}
            {screen === "responsible-ai" && <ResponsibleAIScreen />}
          </main>
        </div>
      )}
    </div>
  );
}
