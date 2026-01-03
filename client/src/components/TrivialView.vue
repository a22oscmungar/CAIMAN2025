<template>
  <div class="trivial-view">
    <div class="overlay">

      <!-- ADMIN -->
      <template v-if="isAdmin">
        <div v-if="feedback != `🎉 Trivial finalizado`">
          <h1>TRIVIAL</h1>
          <h2 class="pregunta">{{ currentQuestion.question }}</h2>

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
        </div>
        <div v-else class="modal-content">
          <h2> Clasificación final</h2>
          <ul>
            <li v-for="u in filteredScores" :key="u.username">
            <b>  {{ u.username }} </b>: {{ u.puntos }} puntos
            </li>
          </ul>
          <div>
            <ul>
              <li>Cayman > 27</li>
              <li>Trucho > 20</li>
              <li>Wawawa > 15</li>
              <li>Poppy > 10</li>
              <li>Sapo <=10</li>
            </ul>
          </div>
        </div>

      </template>

      <!-- JUGADORES -->
      <template v-else>
        <h2 class="pregunta-user" v-if="!hasAnswered">{{ currentQuestion.question }}</h2>

        <div v-if="!hasAnswered" class="answers-grid player">
          <button v-for="(letter, index) in letters" :key="letter" class="answer-btn big" @click="submitAnswer(letter)">
            {{ letter }}
          </button>
        </div>

        <p v-else class="waiting">
          Respuesta enviada<br />
          Esperando al resto...
        </p>

        <p v-if="feedback" class="feedback">{{ feedback }}</p>
      </template>

    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { socket } from "@/socket";
import { useRoute } from "vue-router";

export default {
  name: "GameViewTrivial",
  setup() {
    const route = useRoute();
    const connectedUsers = ref([]);
    const scores = ref([]);

    const username = route.params.username;
    const isAdmin = computed(() => username.toLowerCase() === "oscar");

    const letters = ["A", "B", "C", "D"];

    const currentQuestion = ref({
      question: "",
      answers: []
    });

    const hasAnswered = ref(false);
    const feedback = ref("");

    socket.off("connectedUsers");
    socket.off("newTrivialQuestion");
    socket.off("trivialResult");
    socket.off("trivialFinished");

    const filteredScores = computed(() =>
      scores.value.filter(u => u.username.toLowerCase() !== "oscar")
    );

    onMounted(() => {
      // Pedir lista de jugadores
      socket.emit("requestUsers");

      socket.on("connectedUsers", (users) => {
        connectedUsers.value = users;
      });

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

      socket.on("trivialFinished", (finalScores) => {
        feedback.value = "🎉 Trivial finalizado";
        scores.value = [...finalScores].sort((a, b) => b.puntos - a.puntos);
        console.log("Ranking final:", scores.value);
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
      nextQuestion,
      scores,
      filteredScores
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
  position: fixed;
  inset: 0;
  height: 100dvh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #7edfa1, #32a852);
  overflow: hidden;
  padding: 16px;
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
  grid-template-columns: 1fr;
}

.answer-btn {
  padding: 20px;
  font-size: 1.2em;
  border-radius: 15px;
  border: none;
  cursor: pointer;
  background-color: #32a852;
  color: white;
}

.answer-btn.big {
  font-size: 2em;
  height: 120px;
  margin-right: 30px;
}

.resolve-btn {
  background: #32a852;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  padding: 14px 26px;
  border-radius: 10px;
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
  background: #32a852;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  padding: 14px 26px;
  border-radius: 10px;
  cursor: pointer;
}

.pregunta {
  color: black;
}

.modal-content {
  font-size: x-large;
  margin: 25px;
  text-align: center;
}

ul{
  list-style: none;
}
li{
  list-style: none;
}
</style>
