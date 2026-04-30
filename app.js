const STORAGE_KEY = "fitin_connection_workout_logs_v1";
// MVP only: in production, store this in environment variables or backend authentication.
const ADMIN_PASSWORD = "fitin2026";

const CSV_COLUMNS = [
  "user_id",
  "name",
  "identifier",
  "birth_year",
  "gender",
  "school",
  "workout_date",
  "workout_type",
  "frequency_per_week",
  "duration_minutes",
  "completed_workout_days",
  "total_volume_kg",
  "total_calories",
  "muscle_group",
  "muscle_group_volume_kg",
  "exercise_name",
  "set_count",
  "best_weight_kg",
  "best_reps",
  "estimated_1rm_kg",
  "exercise_volume_kg",
  "condition_score",
  "workout_goal",
  "memo",
  "screenshot_url",
  "created_at",
];

const muscleOptions = [
  "등 (Back)",
  "가슴 (Chest)",
  "어깨 (Shoulders)",
  "하체 (Legs)",
  "이두 (Biceps)",
  "삼두 (Triceps)",
  "복근 (Abs/Core)",
  "유산소 (Cardio)",
  "전신 (Full Body)",
  "기타 (Other)",
];

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return seedStore();
  }

  try {
    return JSON.parse(raw);
  } catch {
    return seedStore();
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function normalize(value) {
  return String(value || "").trim();
}

function seedStore() {
  const userId = uid("user");
  const sessionId = uid("session");
  const store = {
    users: [
      {
        id: userId,
        name: "황제웅",
        student_id_or_phone_last4: "2026",
        birth_year: "2004",
        gender: "남성 (Male)",
        school: "Fitin Connection",
        created_at: "2026-04-13T09:00:00.000Z",
      },
    ],
    workout_sessions: [
      {
        id: sessionId,
        user_id: userId,
        workout_date: "2026-04-13",
        workout_type: "헬스 / 웨이트 트레이닝 (Gym / Weight Training)",
        workout_frequency_per_week: "주 4-5회 (4-5 times a week)",
        workout_duration_minutes: 76,
        completed_workout_days: 22,
        total_volume_kg: 14838,
        total_calories: 369,
        workout_goal: "근성장 (Muscle Gain)",
        condition_score: 4,
        memo: "등 운동 위주. 풀업, 케이블 암 풀다운, 바벨 로우 기록 포함.",
        created_at: "2026-04-13T09:00:00.000Z",
      },
    ],
    workout_muscle_groups: [
      {
        id: uid("muscle"),
        session_id: sessionId,
        muscle_group: "등 (Back)",
        muscle_group_volume_kg: 9000,
        muscle_group_note: "Pull-up, Cable Arm Pulldown, Barbell Row, Lat Pulldown",
      },
      {
        id: uid("muscle"),
        session_id: sessionId,
        muscle_group: "이두 (Biceps)",
        muscle_group_volume_kg: 2500,
        muscle_group_note: "Barbell Curl, Cable Hammer Curl, Incline Dumbbell Curl",
      },
    ],
    workout_exercises: [
      {
        id: uid("exercise"),
        session_id: sessionId,
        muscle_group: "등 (Back)",
        exercise_name: "케이블 암 풀다운",
        set_count: 4,
        best_weight_kg: 30,
        best_reps: 15,
        estimated_1rm_kg: 45,
        total_exercise_volume_kg: 1800,
        exercise_note: "남성 상위 9%",
      },
      {
        id: uid("exercise"),
        session_id: sessionId,
        muscle_group: "등 (Back)",
        exercise_name: "바벨 로우",
        set_count: 4,
        best_weight_kg: 60,
        best_reps: 12,
        estimated_1rm_kg: 84,
        total_exercise_volume_kg: 2520,
        exercise_note: "남성 상위 22%",
      },
    ],
    workout_screenshots: [
      {
        id: uid("shot"),
        session_id: sessionId,
        screenshot_url: "sample_gymwork_2026_04_13.png",
        uploaded_at: "2026-04-13T09:00:00.000Z",
      },
    ],
  };

  writeStore(store);
  return store;
}

function fillMuscleSelect(select) {
  select.innerHTML = `<option value="">선택 (Select)</option>${muscleOptions
    .map((option) => `<option>${option}</option>`)
    .join("")}`;
}

function addMuscleGroup() {
  const template = $("#muscleTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  fillMuscleSelect($("[data-field='muscle_group']", node));
  $(".remove-row", node).addEventListener("click", () => {
    if ($$(".muscle-card").length > 1) node.remove();
  });
  $("#muscleGroups").appendChild(node);
}

function addExercise() {
  const template = $("#exerciseTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  fillMuscleSelect($("[data-field='muscle_group']", node));
  $(".remove-row", node).addEventListener("click", () => node.remove());

  $$("[data-volume-input]", node).forEach((input) => {
    input.addEventListener("input", () => updateExerciseVolume(node));
  });

  $("#exerciseRows").appendChild(node);
}

function updateExerciseVolume(row) {
  const sets = Number($("[data-field='set_count']", row).value || 0);
  const weight = Number($("[data-field='best_weight_kg']", row).value || 0);
  const reps = Number($("[data-field='best_reps']", row).value || 0);
  const volumeInput = $("[data-field='total_exercise_volume_kg']", row);

  if (sets > 0 && weight > 0 && reps > 0) {
    volumeInput.value = String(Number((sets * weight * reps).toFixed(1)));
  }
}

function collectRepeatedCards(selector) {
  return $$(selector).map((card) => {
    const entry = {};
    $$("[data-field]", card).forEach((field) => {
      const key = field.dataset.field;
      const isNumber = field.type === "number";
      entry[key] = isNumber && field.value !== "" ? Number(field.value) : field.value.trim();
    });
    return entry;
  });
}

function validateImages(fileList) {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  return Array.from(fileList).every((file) => allowedTypes.includes(file.type));
}

function findOrCreateUser(store, formData) {
  const name = normalize(formData.get("name"));
  const identifier = normalize(formData.get("identifier"));
  const birthYear = normalize(formData.get("birthYear"));
  const existing = store.users.find(
    (user) =>
      user.name === name &&
      user.student_id_or_phone_last4 === identifier &&
      String(user.birth_year) === birthYear,
  );

  if (existing) return existing;

  const user = {
    id: uid("user"),
    name,
    student_id_or_phone_last4: identifier,
    birth_year: birthYear,
    gender: formData.get("gender"),
    school: normalize(formData.get("school")),
    created_at: new Date().toISOString(),
  };

  store.users.push(user);
  return user;
}

function showMessage(message, isError = false) {
  const messageEl = $("#formMessage");
  messageEl.textContent = message;
  messageEl.classList.toggle("error", isError);
}

function showRecordsMessage(message, isError = false) {
  const messageEl = $("#recordsMessage");
  messageEl.textContent = message;
  messageEl.classList.toggle("error", isError);
}

function findUserByIdentity(store, name, identifier, birthYear) {
  return store.users.find(
    (user) =>
      normalize(user.name) === normalize(name) &&
      normalize(user.student_id_or_phone_last4) === normalize(identifier) &&
      normalize(user.birth_year) === normalize(birthYear),
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function includesText(value, query) {
  return normalize(value).toLowerCase().includes(normalize(query).toLowerCase());
}

function getSessionDetails(store, session) {
  return {
    muscleGroups: store.workout_muscle_groups.filter((group) => group.session_id === session.id),
    exercises: store.workout_exercises.filter((exercise) => exercise.session_id === session.id),
    screenshots: store.workout_screenshots.filter((shot) => shot.session_id === session.id),
  };
}

function renderRecords(user, sessions, store) {
  const totalVolume = sessions.reduce((sum, session) => sum + Number(session.total_volume_kg || 0), 0);
  const totalCalories = sessions.reduce((sum, session) => sum + Number(session.total_calories || 0), 0);
  const recentDates = sessions
    .slice()
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date))
    .slice(0, 5)
    .map((session) => session.workout_date)
    .join(", ");
  const bodyPartSummary = {};

  sessions.forEach((session) => {
    getSessionDetails(store, session).muscleGroups.forEach((group) => {
      const name = group.muscle_group || "기타 (Other)";
      bodyPartSummary[name] = (bodyPartSummary[name] || 0) + Number(group.muscle_group_volume_kg || 0);
    });
  });

  const sortedSessions = sessions.slice().sort((a, b) => b.workout_date.localeCompare(a.workout_date));
  const bodyPartPills = Object.entries(bodyPartSummary)
    .sort((a, b) => b[1] - a[1])
    .map(([name, volume]) => `<span class="body-part-pill">${name}: ${formatNumber(volume)} kg</span>`)
    .join("");

  const records = sortedSessions
    .map((session) => {
      const details = getSessionDetails(store, session);
      const muscles = details.muscleGroups.map((group) => group.muscle_group).filter(Boolean).join(", ") || "-";
      const exerciseNames = details.exercises.map((exercise) => exercise.exercise_name).filter(Boolean).join(", ") || "스크린샷 기반 확인 예정";
      const screenshotNames = details.screenshots.map((shot) => shot.screenshot_url).join(", ") || "-";

      return `
        <article class="record-item">
          <h3>${session.workout_date} · ${session.workout_type}</h3>
          <div class="mini-grid">
            <span>운동 시간: ${formatNumber(session.workout_duration_minutes)}분</span>
            <span>총 볼륨: ${formatNumber(session.total_volume_kg)} kg</span>
            <span>칼로리: ${formatNumber(session.total_calories)} kcal</span>
            <span>컨디션: ${session.condition_score || "-"} / 5</span>
            <span>운동 부위: ${muscles}</span>
            <span>운동 종목: ${exerciseNames}</span>
            <span>완료일: ${session.completed_workout_days ?? "-"}일</span>
            <span>사진: ${screenshotNames}</span>
          </div>
        </article>
      `;
    })
    .join("");

  $("#recordsResults").innerHTML = `
    <section class="panel">
      <p class="section-kicker">Matched User</p>
      <h2>${user.name}님의 기록 (Your Workout Records)</h2>
      <div class="stat-grid">
        <div class="stat-card"><span>총 제출 운동 (Total Sessions)</span><strong>${sessions.length}</strong></div>
        <div class="stat-card volume"><span>총 볼륨 (Total Volume)</span><strong>${formatNumber(totalVolume)} kg</strong></div>
        <div class="stat-card calories"><span>총 칼로리 (Total Calories)</span><strong>${formatNumber(totalCalories)}</strong></div>
        <div class="stat-card"><span>최근 운동일 (Recent Dates)</span><strong>${recentDates || "-"}</strong></div>
      </div>
      <div class="body-part-list">${bodyPartPills || '<span class="body-part-pill">운동 부위 볼륨 없음 (No body part volume yet)</span>'}</div>
    </section>
    <section class="panel">
      <p class="section-kicker">Uploaded Records</p>
      <h2>업로드된 기록 목록 (Uploaded Records List)</h2>
      <div class="record-list">${records}</div>
    </section>
  `;
}

function handleRecordsLookup(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const store = readStore();
  const user = findUserByIdentity(
    store,
    formData.get("recordName"),
    formData.get("recordIdentifier"),
    formData.get("recordBirthYear"),
  );

  if (!user) {
    $("#recordsResults").innerHTML = '<div class="empty-state">일치하는 기록이 없습니다. (No matching records found.)</div>';
    showRecordsMessage("일치하는 사용자를 찾지 못했습니다. (No matching user.)", true);
    return;
  }

  const sessions = store.workout_sessions.filter((session) => session.user_id === user.id);
  if (!sessions.length) {
    $("#recordsResults").innerHTML = '<div class="empty-state">아직 제출된 운동 기록이 없습니다. (No workouts submitted yet.)</div>';
    showRecordsMessage("사용자는 확인되었지만 운동 기록이 없습니다. (User found, no sessions.)", true);
    return;
  }

  renderRecords(user, sessions, store);
  showRecordsMessage("본인 기록만 표시 중입니다. (Showing matched records only.)");
}

function switchView(viewId) {
  $$(".page-view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  $$("[data-view-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.viewTab === viewId));
}

function flattenRows(store) {
  return store.workout_sessions.flatMap((session) => {
    const user = store.users.find((item) => item.id === session.user_id) || {};
    const details = getSessionDetails(store, session);
    const muscleGroups = details.muscleGroups.length ? details.muscleGroups : [{}];
    const exercises = details.exercises.length ? details.exercises : [{}];
    const screenshots = details.screenshots.length ? details.screenshots : [{}];
    const rows = [];

    muscleGroups.forEach((muscle) => {
      exercises.forEach((exercise) => {
        screenshots.forEach((shot) => {
          rows.push({
            user_id: session.user_id,
            name: user.name || "",
            identifier: user.student_id_or_phone_last4 || "",
            birth_year: user.birth_year || "",
            gender: user.gender || "",
            school: user.school || "",
            workout_date: session.workout_date,
            workout_type: session.workout_type,
            frequency_per_week: session.workout_frequency_per_week,
            duration_minutes: session.workout_duration_minutes,
            completed_workout_days: session.completed_workout_days ?? "",
            total_volume_kg: session.total_volume_kg,
            total_calories: session.total_calories,
            muscle_group: muscle.muscle_group || "",
            muscle_group_volume_kg: muscle.muscle_group_volume_kg ?? "",
            exercise_name: exercise.exercise_name || "",
            set_count: exercise.set_count ?? "",
            best_weight_kg: exercise.best_weight_kg ?? "",
            best_reps: exercise.best_reps ?? "",
            estimated_1rm_kg: exercise.estimated_1rm_kg ?? "",
            exercise_volume_kg: exercise.total_exercise_volume_kg ?? "",
            condition_score: session.condition_score,
            workout_goal: session.workout_goal || "",
            memo: session.memo || "",
            screenshot_url: shot.screenshot_url || "",
            created_at: session.created_at,
          });
        });
      });
    });

    return rows;
  });
}

function getFilteredAdminRows() {
  const store = readStore();
  const form = $("#adminFilters");
  const formData = new FormData(form);
  const startDate = normalize(formData.get("startDate"));
  const endDate = normalize(formData.get("endDate"));
  const nameQuery = normalize(formData.get("nameQuery"));
  const typeQuery = normalize(formData.get("typeQuery"));
  const bodyPartQuery = normalize(formData.get("bodyPartQuery"));

  return flattenRows(store).filter((row) => {
    const inDateRange = (!startDate || row.workout_date >= startDate) && (!endDate || row.workout_date <= endDate);
    const matchesName = !nameQuery || includesText(row.name, nameQuery);
    const matchesType = !typeQuery || includesText(row.workout_type, typeQuery);
    const matchesBodyPart = !bodyPartQuery || includesText(row.muscle_group, bodyPartQuery);
    return inDateRange && matchesName && matchesType && matchesBodyPart;
  });
}

function getAdminSessionRows() {
  const store = readStore();
  const rows = getFilteredAdminRows();
  const uniqueSessionIds = new Set();

  return store.workout_sessions.filter((session) => {
    if (uniqueSessionIds.has(session.id)) return false;
    const matches = rows.some((row) => row.created_at === session.created_at && row.user_id === session.user_id);
    if (matches) uniqueSessionIds.add(session.id);
    return matches;
  });
}

function renderAdminDashboard() {
  const store = readStore();
  const filteredRows = getFilteredAdminRows();
  const filteredSessions = getAdminSessionRows();
  const totalVolume = filteredSessions.reduce((sum, session) => sum + Number(session.total_volume_kg || 0), 0);
  const totalCalories = filteredSessions.reduce((sum, session) => sum + Number(session.total_calories || 0), 0);
  const userIds = new Set(filteredSessions.map((session) => session.user_id));

  $("#adminSummary").innerHTML = `
    <div class="stat-card"><span>총 사용자 (Total Users)</span><strong>${userIds.size}</strong></div>
    <div class="stat-card"><span>운동 세션 (Workout Sessions)</span><strong>${filteredSessions.length}</strong></div>
    <div class="stat-card volume"><span>총 볼륨 (Total Volume)</span><strong>${formatNumber(totalVolume)} kg</strong></div>
    <div class="stat-card calories"><span>총 칼로리 (Total Calories)</span><strong>${formatNumber(totalCalories)}</strong></div>
  `;

  const uniqueRows = filteredSessions.map((session) => {
    const user = store.users.find((item) => item.id === session.user_id) || {};
    const details = getSessionDetails(store, session);
    return {
      user,
      session,
      muscles: details.muscleGroups.map((group) => group.muscle_group).filter(Boolean).join(", ") || "-",
    };
  });

  $("#adminTableBody").innerHTML = uniqueRows
    .map(
      ({ user, session, muscles }) => `
        <tr>
          <td>${user.name || "-"}</td>
          <td>${session.workout_date}</td>
          <td>${session.workout_type}</td>
          <td>${muscles}</td>
          <td>${formatNumber(session.total_volume_kg)} kg</td>
          <td>${formatNumber(session.total_calories)}</td>
          <td>${session.condition_score || "-"} / 5</td>
        </tr>
      `,
    )
    .join("");

  $("#adminTableMessage").textContent = filteredRows.length
    ? `${filteredSessions.length}개 세션, ${filteredRows.length}개 export row가 검색되었습니다.`
    : "검색 조건과 일치하는 기록이 없습니다. (No matching records.)";
}

function handleAdminLogin(event) {
  event.preventDefault();
  const password = normalize(new FormData(event.currentTarget).get("adminPassword"));

  if (password !== ADMIN_PASSWORD) {
    $("#adminPanel").hidden = true;
    $("#adminLoginMessage").textContent = "비밀번호가 올바르지 않습니다. (Incorrect password.)";
    $("#adminLoginMessage").classList.add("error");
    return;
  }

  $("#adminPanel").hidden = false;
  $("#adminLoginMessage").textContent = "관리자 화면이 열렸습니다. (Admin unlocked.)";
  $("#adminLoginMessage").classList.remove("error");
  renderAdminDashboard();
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const rows = getFilteredAdminRows();
  const csv = [
    CSV_COLUMNS.join(","),
    ...rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");

  downloadFile("fitin_connection_workout_records.csv", csv, "text/csv;charset=utf-8");
}

function exportJson() {
  const rows = getFilteredAdminRows();
  downloadFile("fitin_connection_workout_records.json", JSON.stringify(rows, null, 2), "application/json");
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const files = form.elements.screenshots.files;
  const muscleGroups = collectRepeatedCards(".muscle-card");
  const exercises = collectRepeatedCards(".exercise-card").filter((exercise) => exercise.exercise_name);

  if (!validateImages(files)) {
    showMessage("이미지 파일만 업로드할 수 있습니다. (Only image files are allowed.)", true);
    return;
  }

  if (!muscleGroups.length || muscleGroups.some((group) => !group.muscle_group)) {
    showMessage("운동 부위를 최소 1개 선택해주세요. (Select at least one body part.)", true);
    return;
  }

  const store = readStore();
  const user = findOrCreateUser(store, formData);
  const sessionId = uid("session");
  const createdAt = new Date().toISOString();

  store.workout_sessions.push({
    id: sessionId,
    user_id: user.id,
    workout_date: formData.get("workoutDate"),
    workout_type: formData.get("workoutType"),
    workout_frequency_per_week: formData.get("frequency"),
    workout_duration_minutes: Number(formData.get("duration")),
    completed_workout_days: formData.get("completedDays") ? Number(formData.get("completedDays")) : null,
    total_volume_kg: Number(formData.get("totalVolume")),
    total_calories: Number(formData.get("totalCalories")),
    workout_goal: formData.get("goal"),
    condition_score: Number(formData.get("condition")),
    memo: normalize(formData.get("memo")),
    created_at: createdAt,
  });

  muscleGroups.forEach((group) => {
    store.workout_muscle_groups.push({
      id: uid("muscle"),
      session_id: sessionId,
      muscle_group: group.muscle_group,
      muscle_group_volume_kg: group.muscle_group_volume_kg || null,
      muscle_group_note: group.muscle_group_note || "",
    });
  });

  exercises.forEach((exercise) => {
    store.workout_exercises.push({
      id: uid("exercise"),
      session_id: sessionId,
      muscle_group: exercise.muscle_group || "",
      exercise_name: exercise.exercise_name,
      set_count: exercise.set_count || null,
      best_weight_kg: exercise.best_weight_kg || null,
      best_reps: exercise.best_reps || null,
      estimated_1rm_kg: exercise.estimated_1rm_kg || null,
      total_exercise_volume_kg: exercise.total_exercise_volume_kg || null,
      exercise_note: exercise.exercise_note || "",
    });
  });

  Array.from(files).forEach((file) => {
    store.workout_screenshots.push({
      id: uid("shot"),
      session_id: sessionId,
      screenshot_url: file.name,
      uploaded_at: createdAt,
    });
  });

  writeStore(store);
  form.reset();
  $("#muscleGroups").innerHTML = "";
  $("#exerciseRows").innerHTML = "";
  addMuscleGroup();
  addExercise();
  showMessage("저장되었습니다. (Workout log saved locally.)");
}

document.addEventListener("DOMContentLoaded", () => {
  readStore();
  addMuscleGroup();
  addExercise();
  $("#addMuscleGroup").addEventListener("click", addMuscleGroup);
  $("#addExercise").addEventListener("click", addExercise);
  $("#workoutForm").addEventListener("submit", handleSubmit);
  $("#recordsForm").addEventListener("submit", handleRecordsLookup);
  $("#adminLoginForm").addEventListener("submit", handleAdminLogin);
  $("#adminFilters").addEventListener("input", renderAdminDashboard);
  $("#exportCsv").addEventListener("click", exportCsv);
  $("#exportJson").addEventListener("click", exportJson);
  $$("[data-view-tab]").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.viewTab));
  });
});
