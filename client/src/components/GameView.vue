<template>
  <div class="game-view">

    <div class="players-grid" v-if="!isAdmin && tuVoto == ''">
        <button v-for="(u, index) in connectedUsers" :key="u.socketId" :class="['player-btn', `color-${index % 8}`]"
          @click="selectVote(u.username)">
          {{ u.username === "oscar" ? "Oscar" : u.username }}
        </button>
    </div>

    <div class="hasVotado" v-if="tuVoto != ''">
      Has votado a {{ tuVoto }}
    </div>

    <!-- Solo visible para el admin -->
    <div v-if="isAdmin" class="admin-panel">
      <h1 class="title">¿QUIÉN ES MÁS PROBABLE QUE...?</h1>
      <h2 class="question">{{ currentQuestion }}</h2>

      <div class="botones">
        <button class="admin-btn" @click="nextQuestion">
          Siguiente pregunta
        </button>
        <button class="admin-btn" @click="checkVotes">
          Comprobar votos
        </button>
      </div>

      <div class="modal-content">
        <h3>Puntuaciones actuales</h3>
        <ul>
          <li v-for="s in scores" :key="s.username">
            {{ s.username }} — {{ s.puntos }} puntos
          </li>
        </ul>
      </div>
    </div>

    <p v-if="winner" class="winner-msg">
      El más votado fue: {{ winner }}
    </p>
  </div>
</template>
<script>
import { ref, computed, onMounted } from "vue";
import { socket } from "@/socket";
import { useRouter, useRoute } from "vue-router";

export default {
  name: "GameView",
  setup() {
    const route = useRoute();
    const router = useRouter();

    const username = route.params.username;
    const connectedUsers = ref([]);

    const currentQuestion = ref("Cargando pregunta...");
    const votes = ref({});
    const scores = ref([]);
    const winner = ref("");
    const showScores = ref(false);
    const tuVoto = ref("");

    const isAdmin = computed(() => username.toLowerCase() === "oscar");

    // Registrar un voto
    const selectVote = (votedFor) => {
      socket.emit("submitVote", { username, votedFor });
      console.log(`${username} votó por ${votedFor}`);
      tuVoto.value = votedFor
    };

    // ADMIN → pide siguiente pregunta
    const nextQuestion = () => {
      socket.emit("requestQuestion", { fromAdmin: true });
      winner.value = "";
    };

    // ADMIN → comprobar votos
    const checkVotes = () => {
      socket.emit("checkVotes");
    };

    // Mostrar u ocultar puntuaciones
    const toggleScores = () => {
      showScores.value = !showScores.value;
    };

    // Volver a trivial cuando se acabe
    socket.on("mostLikelyFinished", () => {
      router.push({
        name: "Trivial",
        params: { username },
      });
    });

    onMounted(() => {
      console.log("GameView montado. Jugador:", username);

      // 🔥 MUY IMPORTANTE: volver a hacer join en esta vista
      socket.emit("join", {
        username,
        displayName: username
      });

      // Pedir lista de jugadores
      socket.emit("requestUsers");

      socket.on("connectedUsers", (users) => {
        connectedUsers.value = users;
      });

      // ADMIN pide la primera pregunta
      if (isAdmin.value) {
        socket.emit("requestQuestion", { fromAdmin: true });
      }

      socket.on("newQuestion", (question) => {
        console.log("Nueva pregunta recibida:", question);
        currentQuestion.value = question;
        tuVoto.value = ""
        winner.value = ""
      });

      socket.on("votesChecked", (data) => {
        winner.value = data.winner;
        scores.value = data.scores;
      });
    });


    return {
      username,
      connectedUsers,
      currentQuestion,
      isAdmin,
      selectVote,
      nextQuestion,
      checkVotes,
      winner,
      scores,
      showScores,
      toggleScores,
      tuVoto
    };
  },
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

.game-view {
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
  background: rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  width: 90%;
  max-width: 700px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 5em;
  margin-bottom: 10px;
  font-weight: 700;
  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000,
    -1px 0 0 #000,
    1px 0 0 #000,
    0 -1px 0 #000,
    0 1px 0 #000;
}

.question {
  font-size: 3em;
  margin-bottom: 40px;
  font-weight: 500;
  text-align: center;

  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000,
    -1px 0 0 #000,
    1px 0 0 #000,
    0 -1px 0 #000,
    0 1px 0 #000;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
  justify-items: center;
}

.player-btn {
  padding: 15px 20px;
  font-size: 3em;
  border: none;
  border-radius: 15px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

  text-shadow:
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000,
    2px 2px 0 #000,
    -2px 0 0 #000,
    2px 0 0 #000,
    0 -2px 0 #000,
    0 2px 0 #000;
}

.player-btn:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3);
}

/* 🎨 Paleta de colores */
.color-0 {
  background-color: #ff6b6b;
}

.color-1 {
  background-color: #ffb86b;
}

.color-2 {
  background-color: #f6d365;
}

.color-3 {
  background-color: #6bc1ff;
}

.color-4 {
  background-color: #a66bff;
}

.color-5 {
  background-color: #6bffb8;
}

.color-6 {
  background-color: #ff6be0;
}

.color-7 {
  background-color: #6bfffd;
}

.modal-content {
  background-color: white;
  color: black;
  padding: 10px 250px 10px 250px;
  font-size: x-large;
  margin: 25px;
  text-align: center;
}

.botones {
  color: black;
  padding: 10px 250px 10px 250px;
  font-size: x-large;
  margin: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 100px;
  border: #000;
}

button {
  background: #32a852;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  padding: 14px 26px;
  border-radius: 10px;
  cursor: pointer;
}

.winner-msg {
  font-size: x-large;
}

.hasVotado {
  background: white;
  padding: 50px;
  color: #000;
  border-radius: 12px;
  margin-top: 25px;
  font-size: large;
}
li{
  list-style: none;
}
</style>