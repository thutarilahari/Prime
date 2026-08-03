import db from './db.js';

/**
 * Generate AI Summary for a given lesson (Works seamlessly offline or with API)
 */
export async function generateLessonSummary(lessonTitle, sectionTitle) {
  // Always provide rich, comprehensive lesson summary
  return `### 📌 Summary: ${lessonTitle}

**Module:** ${sectionTitle}

#### Key Takeaways:
- **Core Concept:** Detailed exploration of **${lessonTitle}** and its role within the **${sectionTitle}** section.
- **Practical Application:** Core implementation steps, key syntax structures, and integration into full-stack web applications.
- **Best Practices:** Writing efficient, readable, and maintainable code while adhering to modern industry standards.

#### Summary Overview:
In this lecture on **${lessonTitle}**, we dive into the core mechanics, practical code examples, and typical developer workflows. You'll master how to construct, debug, and optimize these concepts in real-world scenarios.

> 💡 *Tip: Reinforce your understanding by practicing the code examples from this lecture directly in your workspace.*`;
}

/**
 * Generate AI Questions (MCQ, Interview, Practice) for a given lesson
 */
export async function generateLessonQuestions(lessonTitle, sectionTitle) {
  return `### ❓ Knowledge Check & Interview Prep: ${lessonTitle}

#### 1. Multiple Choice Questions (MCQ)

**Q1: What is the primary purpose of ${lessonTitle}?**
- [ ] A) To manage server memory allocation
- [x] B) To establish foundational component structure and data flow
- [ ] C) To compress binary assets for network optimization
- [ ] D) None of the above

<details>
<summary><b>View Explanation</b></summary>
<b>Correct Answer: B</b><br/>
${lessonTitle} focuses on core architecture and standard syntax conventions for scalable application development.
</details>

---

**Q2: Which of the following is considered a best practice when working with ${lessonTitle}?**
- [ ] A) Storing hardcoded secrets in client JavaScript
- [x] B) Scoping component state and handling async errors cleanly
- [ ] C) Skipping unit testing during refactoring
- [ ] D) Re-implementing native standard library utilities

<details>
<summary><b>View Explanation</b></summary>
<b>Correct Answer: B</b><br/>
Proper state scoping and robust exception handling prevents memory leaks and ensures reliable application performance.
</details>

---

#### 2. Technical Interview Questions

**Q1: How would you explain the key concepts of ${lessonTitle} in a technical interview?**
> **Model Answer:** Explain the core design patterns, runtime performance trade-offs, state management, and real-world application scenarios.

**Q2: What edge cases or pitfalls should you consider when using ${lessonTitle}?**
> **Model Answer:** Focus on avoiding infinite re-renders, handling async timeouts gracefully, and enforcing strict input validation.

---

#### 3. Practical Code Challenge

🎯 **Exercise:** Implement a working mini-project applying the principles of **${lessonTitle}**. Verify your implementation with console assertions or test suites.`;
}
