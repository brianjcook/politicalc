(function () {
  "use strict";

  const DATA_FILE = "political-quiz-bank.json";
  const STORAGE_KEY = "politicalc_quiz_state_v1";

  const state = {
    data: null,
    answers: [],
    currentIndex: 0,
    chart: null
  };

  const views = {
    error: document.getElementById("view-error"),
    start: document.getElementById("view-start"),
    question: document.getElementById("view-question"),
    review: document.getElementById("view-review"),
    results: document.getElementById("view-results")
  };

  const el = {
    errorMessage: document.getElementById("error-message"),
    retryButton: document.getElementById("retry-button"),
    startButton: document.getElementById("start-button"),
    resumeButton: document.getElementById("resume-button"),
    startOverButton: document.getElementById("start-over-button"),
    progressText: document.getElementById("progress-text"),
    questionText: document.getElementById("question-text"),
    answersForm: document.getElementById("answers-form"),
    backButton: document.getElementById("back-button"),
    nextButton: document.getElementById("next-button"),
    reviewList: document.getElementById("review-list"),
    reviewBackButton: document.getElementById("review-back-button"),
    showResultsButton: document.getElementById("show-results-button"),
    chartCanvas: document.getElementById("results-chart"),
    personaName: document.getElementById("persona-name"),
    personaSummary: document.getElementById("persona-summary"),
    resultsSummary: document.getElementById("results-summary"),
    resultsBody: document.getElementById("results-tbody"),
    retakeButton: document.getElementById("retake-button"),
    downloadPdfButton: document.getElementById("download-pdf-button"),
    resultsFeedback: document.getElementById("results-feedback")
  };

  function showView(name) {
    Object.keys(views).forEach((key) => {
      views[key].classList.toggle("hidden", key !== name);
    });
  }

  function getLikertLabel(value) {
    const likert = state.data.response_sets.likert5;
    const match = likert.find((item) => item.value === value);
    return match ? match.label : "No answer";
  }

  function saveProgress() {
    const payload = {
      answers: state.answers,
      currentIndex: state.currentIndex
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const saved = JSON.parse(raw);
      const questionCount = state.data.questions.length;

      if (!Array.isArray(saved.answers) || saved.answers.length !== questionCount) {
        return false;
      }

      state.answers = saved.answers.map((v) => {
        if (v === null) return null;
        const n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
      });

      state.currentIndex = Number.isInteger(saved.currentIndex)
        ? Math.max(0, Math.min(saved.currentIndex, questionCount - 1))
        : 0;

      return state.answers.some((v) => v !== null);
    } catch (_err) {
      return false;
    }
  }

  function clearProgress() {
    state.answers = new Array(state.data.questions.length).fill(null);
    state.currentIndex = 0;
    localStorage.removeItem(STORAGE_KEY);
  }

  function firstUnansweredIndex() {
    const idx = state.answers.findIndex((v) => v === null);
    return idx === -1 ? state.answers.length - 1 : idx;
  }

  function renderQuestion() {
    const questions = state.data.questions;
    const question = questions[state.currentIndex];
    const selected = state.answers[state.currentIndex];
    const likert = state.data.response_sets.likert5;

    el.progressText.textContent = "Question " + (state.currentIndex + 1) + " of " + questions.length;
    el.questionText.textContent = question.text;
    el.answersForm.innerHTML = "";

    likert.forEach((option) => {
      const wrapper = document.createElement("label");
      wrapper.className = "answer-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = String(option.value);
      input.checked = selected === option.value;
      input.addEventListener("change", () => {
        state.answers[state.currentIndex] = option.value;
        saveProgress();
        el.nextButton.disabled = false;
      });

      const text = document.createElement("span");
      text.textContent = option.label;

      wrapper.appendChild(input);
      wrapper.appendChild(text);
      el.answersForm.appendChild(wrapper);
    });

    el.backButton.disabled = state.currentIndex === 0;
    el.nextButton.disabled = selected === null;
    el.nextButton.textContent = state.currentIndex === questions.length - 1 ? "Review" : "Next";

    showView("question");
  }

  function renderReview() {
    el.reviewList.innerHTML = "";

    state.data.questions.forEach((question, idx) => {
      const item = document.createElement("li");
      item.className = "review-item";

      const q = document.createElement("p");
      q.className = "review-question";
      q.textContent = (idx + 1) + ". " + question.text;

      const a = document.createElement("p");
      a.className = "review-answer";
      a.textContent = "Answer: " + getLikertLabel(state.answers[idx]);

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "inline-button";
      edit.textContent = "Edit this question";
      edit.addEventListener("click", () => {
        state.currentIndex = idx;
        saveProgress();
        renderQuestion();
      });

      item.appendChild(q);
      item.appendChild(a);
      item.appendChild(edit);
      el.reviewList.appendChild(item);
    });

    showView("review");
  }

  function getAxisSideLabel(axisLabel, isHighSide) {
    const parts = axisLabel.split(" vs ");
    if (parts.length === 2) {
      return isHighSide ? parts[0].trim() : parts[1].trim();
    }
    return isHighSide ? "High-end position" : "Low-end position";
  }

  function calculateResults() {
    const axes = state.data.axes.map((axis) => ({
      id: axis.id,
      label: axis.label,
      highMeans: axis.high_means,
      lowMeans: axis.low_means,
      raw: 0,
      count: 0
    }));

    const axisIndex = {};
    axes.forEach((axis, idx) => {
      axisIndex[axis.id] = idx;
    });

    state.data.questions.forEach((question, idx) => {
      const answer = state.answers[idx];
      if (answer === null) return;

      let n = answer - 1;
      if (question.reverse) {
        n = 4 - n;
      }

      const target = axes[axisIndex[question.axis]];
      target.raw += n;
      target.count += 1;
    });

    return axes.map((axis) => {
      const max = 4 * axis.count;
      const percent = max > 0 ? Math.round((axis.raw / max) * 100) : 0;
      const highSide = getAxisSideLabel(axis.label, true);
      const lowSide = getAxisSideLabel(axis.label, false);
      const side = percent >= 50 ? highSide : lowSide;
      const offset = Math.abs(percent - 50);
      const strength = offset >= 35 ? "Strong" : offset >= 20 ? "Moderate" : "Slight";
      const direction = percent === 50 ? "Balanced midpoint" : strength + " lean toward " + side;

      return {
        label: axis.label,
        percent: percent,
        direction: direction,
        highSide: highSide,
        lowSide: lowSide,
        highMeans: axis.highMeans,
        lowMeans: axis.lowMeans
      };
    });
  }

  function generatePersona(results) {
    const ranked = results
      .map((r) => ({ ...r, distance: Math.abs(r.percent - 50) }))
      .sort((a, b) => b.distance - a.distance);

    const primary = ranked[0];
    const secondary = ranked[1] || ranked[0];

    function archetypeFromRow(row) {
      const high = row.percent >= 50;
      if (row.label.includes("Order vs Civil Liberties")) return high ? "Orderkeeper" : "Liberty Guard";
      if (row.label.includes("Institutional Trust")) return high ? "Institutionalist" : "Skeptic";
      if (row.label.includes("Economic Role of Government")) return high ? "Public Steward" : "Market Advocate";
      if (row.label.includes("Pluralism vs Majoritarianism")) return high ? "Majoritarian" : "Pluralist";
      if (row.label.includes("National Identity vs Cosmopolitanism")) return high ? "National Traditionalist" : "Civic Cosmopolitan";
      if (row.label.includes("Populism")) return high ? "Populist Challenger" : "Technocratic Gradualist";
      if (row.label.includes("Social & Cultural Traditionalism")) return high ? "Cultural Traditionalist" : "Social Liberal";
      if (row.label.includes("Group Hierarchy vs Egalitarianism")) return high ? "Hierarchy Realist" : "Equality Advocate";
      return high ? "High-Side Leaner" : "Low-Side Leaner";
    }

    const name = archetypeFromRow(primary) + " / " + archetypeFromRow(secondary);
    const summary = "Strongest tilt: " + primary.direction + ". Secondary tilt: " + secondary.direction + ".";

    return { name, summary };
  }

  async function exportResultsPdf() {
    try {
      el.resultsFeedback.textContent = "Building PDF...";

      if (!window.html2canvas || !window.jspdf || !window.jspdf.jsPDF) {
        throw new Error("PDF libraries failed to load.");
      }

      const target = views.results;
      const canvas = await window.html2canvas(target, {
        scale: 2,
        backgroundColor: "#ffffff"
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new window.jspdf.jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const contentWidth = pageWidth - margin * 2;
      const scaledHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = scaledHeight;
      let position = margin;

      pdf.addImage(imageData, "PNG", margin, position, contentWidth, scaledHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = margin - (scaledHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imageData, "PNG", margin, position, contentWidth, scaledHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save("politicalc-results.pdf");
      el.resultsFeedback.textContent = "Results PDF downloaded.";
    } catch (err) {
      el.resultsFeedback.textContent = "PDF export failed: " + err.message;
    }
  }

  function renderResults() {
    const results = calculateResults();
    const rankedResults = results
      .slice()
      .sort((a, b) => Math.abs(b.percent - 50) - Math.abs(a.percent - 50));
    const persona = generatePersona(results);

    el.personaName.textContent = persona.name;
    el.personaSummary.textContent = persona.summary;

    if (state.chart) {
      state.chart.destroy();
    }

    state.chart = new Chart(el.chartCanvas, {
      type: "radar",
      data: {
        labels: results.map((r) => r.label),
        datasets: [
          {
            label: "Axis Score (0-100)",
            data: results.map((r) => r.percent),
            backgroundColor: "rgba(15, 118, 110, 0.24)",
            borderColor: "#0f766e",
            borderWidth: 2,
            pointBackgroundColor: "#125a8f",
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 1400,
          easing: "easeOutQuart"
        },
        plugins: {
          legend: {
            labels: {
              font: {
                family: "interstate-mono"
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => "Score: " + ctx.parsed.r + "%",
              afterLabel: (ctx) => results[ctx.dataIndex].direction
            }
          }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            pointLabels: {
              font: {
                family: "interstate-mono",
                size: 11
              }
            },
            ticks: {
              stepSize: 20
            }
          }
        }
      }
    });

    el.resultsSummary.innerHTML = "";
    rankedResults.forEach((row) => {
      const card = document.createElement("article");
      card.className = "result-card";
      card.style.setProperty("--score", String(row.percent));
      card.title = "Low end: " + row.lowMeans + " | High end: " + row.highMeans;

      const title = document.createElement("h3");
      title.textContent = row.label + " (" + row.percent + "%)";

      const meter = document.createElement("div");
      meter.className = "result-meter";

      const ends = document.createElement("div");
      ends.className = "result-ends";

      const low = document.createElement("span");
      low.className = "result-end-low";
      low.textContent = "0%: " + row.lowSide;

      const high = document.createElement("span");
      high.className = "result-end-high";
      high.textContent = "100%: " + row.highSide;

      ends.appendChild(low);
      ends.appendChild(high);

      const lean = document.createElement("p");
      lean.className = "result-lean";
      lean.textContent = row.direction;

      card.appendChild(title);
      card.appendChild(meter);
      card.appendChild(ends);
      card.appendChild(lean);
      el.resultsSummary.appendChild(card);
    });

    el.resultsBody.innerHTML = "";
    rankedResults.forEach((row) => {
      const tr = document.createElement("tr");

      const tdAxis = document.createElement("td");
      tdAxis.textContent = row.label;

      const tdScore = document.createElement("td");
      tdScore.textContent = row.percent + "%";

      const tdExp = document.createElement("td");
      tdExp.textContent = row.direction;

      tr.appendChild(tdAxis);
      tr.appendChild(tdScore);
      tr.appendChild(tdExp);
      el.resultsBody.appendChild(tr);
    });

    el.downloadPdfButton.onclick = exportResultsPdf;

    showView("results");
  }

  function startQuiz() {
    state.currentIndex = firstUnansweredIndex();
    saveProgress();
    renderQuestion();
  }

  function wireEvents() {
    el.retryButton.addEventListener("click", init);

    el.startButton.addEventListener("click", () => {
      if (!state.answers.some((v) => v !== null)) {
        clearProgress();
      }
      startQuiz();
    });

    el.resumeButton.addEventListener("click", startQuiz);

    el.startOverButton.addEventListener("click", () => {
      if (confirm("Clear all answers and restart the quiz?")) {
        clearProgress();
        showStartView();
      }
    });

    el.backButton.addEventListener("click", () => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        saveProgress();
        renderQuestion();
      }
    });

    el.nextButton.addEventListener("click", () => {
      if (state.answers[state.currentIndex] === null) {
        return;
      }

      if (state.currentIndex === state.data.questions.length - 1) {
        renderReview();
        return;
      }

      state.currentIndex += 1;
      saveProgress();
      renderQuestion();
    });

    el.reviewBackButton.addEventListener("click", () => {
      state.currentIndex = firstUnansweredIndex();
      renderQuestion();
    });

    el.showResultsButton.addEventListener("click", () => {
      const missing = firstUnansweredIndex();
      if (state.answers.includes(null)) {
        state.currentIndex = missing;
        renderQuestion();
        return;
      }
      renderResults();
    });

    el.retakeButton.addEventListener("click", () => {
      clearProgress();
      showStartView();
    });
  }

  function showStartView() {
    const hasProgress = state.answers.some((v) => v !== null);
    el.resumeButton.classList.toggle("hidden", !hasProgress);
    showView("start");
  }

  async function init() {
    try {
      const res = await fetch(DATA_FILE, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("HTTP " + res.status + " while fetching quiz data.");
      }

      state.data = await res.json();
      state.answers = new Array(state.data.questions.length).fill(null);
      state.currentIndex = 0;
      loadProgress();
      showStartView();
    } catch (err) {
      el.errorMessage.textContent = "Could not load '" + DATA_FILE + "'. " + err.message;
      showView("error");
    }
  }

  wireEvents();
  init();
})();
