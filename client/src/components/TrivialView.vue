<template>
  <div class="trivial-view">
    <div class="overlay">

      <!-- ADMIN -->
      <template v-if="isAdmin">
        <h1>TRIVIAL</h1>
        <h2>{{ currentQuestion.question }}</h2>

        <div class="answers-grid admin">
          <button v-for="(ans, index) in currentQuestion.answers" :key="index" class="answer-btn">
            {{ letters[index] }} - {{ ans }}
          </button>
        </div>

        <div class="admin-actions">
          <button class="resolve-btn" @click="resolveQuestion">
            Resolver pregunta
          </button>

          <button class="next-btn" @click="nextQuestion">
            Siguiente pregunta
          </button>
        </div>

        <p v-if="feedback" class="feedback">{{ feedback }}</p>
      </template>

      <!-- JUGADORES -->
      <template v-else>
        <h2 v-if="!hasAnswered">{{ currentQuestion.question }}</h2>

        <div v-if="!hasAnswered" class="answers-grid player">
          <button v-for="(letter, index) in letters" :key="letter" class="answer-btn big" @click="submitAnswer(letter)">
            {{ letter }}
          </button>
        </div>

        <p v-else class="waiting">
          ✅ Respuesta enviada<br />
          Esperando al resto...
        </p>

        <p v-if="feedback" class="feedback">{{ feedback }}</p>
      </template>

    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";
import { useRoute } from "vue-router";

export default {
  name: "GameViewTrivial",
  setup() {
    const route = useRoute();
    const socket = io("http://localhost:3000");

    const username = route.params.username;
    const isAdmin = computed(() => username.toLowerCase() === "oscar");

    const letters = ["A", "B", "C", "D"];

    const currentQuestion = ref({
      question: "",
      answers: []
    });

    const hasAnswered = ref(false);
    const feedback = ref("");

    onMounted(() => {
      socket.emit("requestTrivialQuestion");

      socket.on("newTrivialQuestion", (q) => {
        currentQuestion.value = q;
        hasAnswered.value = false;
        feedback.value = "";
      });

      socket.on("trivialResult", ({ username: user, correct }) => {
        if (user === username) {
          feedback.value = correct
            ? "✔ ¡Respuesta correcta!"
            : "✘ Respuesta incorrecta";
        }
      });

      socket.on("trivialFinished", () => {
        feedback.value = "🎉 Trivial finalizado";
      });
    });

    function submitAnswer(letter) {
      const index = letters.indexOf(letter);
      const answer = currentQuestion.value.answers[index];

      socket.emit("submitTrivialAnswer", {
        username,
        answer
      });

      hasAnswered.value = true;
    }

    function resolveQuestion() {
      socket.emit("resolveTrivialQuestion");
    }

    function nextQuestion() {
      socket.emit("nextTrivialQuestion");
    }

    return {
      isAdmin,
      letters,
      currentQuestion,
      hasAnswered,
      feedback,
      submitAnswer,
      resolveQuestion,
      nextQuestion
    };
  }
};
</script>


<style scoped>
html,
body,
#app {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}

.trivial-view {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  /* Título arriba, login abajo */
  color: white;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #7edfa1, #32a852);
}

.overlay {
  background: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 20px;
  width: 100%;
  max-width: 700px;
  text-align: center;
}

.answers-grid {
  display: grid;
  gap: 15px;
  margin: 30px 0;
}

.answers-grid.admin {
  grid-template-columns: 1fr 1fr;
}

.answers-grid.player {
  grid-template-columns: 1fr 1fr;
}

.answer-btn {
  padding: 20px;
  font-size: 1.2em;
  border-radius: 15px;
  border: none;
  cursor: pointer;
}

.answer-btn.big {
  font-size: 2em;
  height: 120px;
}

.resolve-btn {
  margin-top: 20px;
  padding: 15px 25px;
  font-size: 1.2em;
  cursor: pointer;
}

.waiting {
  font-size: 1.4em;
  margin-top: 40px;
}

.feedback {
  margin-top: 20px;
  font-weight: bold;
}

.admin-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
}

.next-btn {
  padding: 15px 25px;
  font-size: 1.2em;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: #4a90e2;
  color: white;
}
</style>
