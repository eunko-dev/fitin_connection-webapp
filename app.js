const STORAGE_KEY = "fitin_connection_workout_logs_v1";

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
  const name = formData.get("name").trim();
  const identifier = formData.get("identifier").trim();
  const birthYear = formData.get("birthYear").trim();
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
    school: formData.get("school").trim(),
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
    memo: formData.get("memo").trim(),
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
});
