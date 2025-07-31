const runQuiz = () => {
  const make_quiz = Module.cwrap("make_quiz", "void", ["number", "number", "number", "number"]);

  const bufSize = 2048;
  const bufPtr = Module._malloc(bufSize);

  const level = 3;
  const count = 10;

  make_quiz(level, count, bufPtr, bufSize);

  const quiz = Module.UTF8ToString(bufPtr);
  Module._free(bufPtr);

  document.getElementById("quiz-output").textContent = quiz;
};
