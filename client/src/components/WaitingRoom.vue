<template>
  <div class="main">
    <h1>Sala de espera</h1>
    <div class="waiting-room">
      <p class="welcome-message">Bienvenido, {{ user.displayName }}!</p>

      <h3>Jugadores conectados:</h3>
      <ul>
        <li v-for="u in filteredUsers" :key="u.socketId">
          {{ u.displayName }}
        </li>
      </ul>

      <!-- Si es Oscar, muestra el botón -->
      <button v-if="isOscar" @click="startGame">Iniciar juego</button>

      <!-- Si no es Oscar, muestra mensaje -->
      <p v-else>Esperando al resto de parguelas...</p>
    </div>
  </div>

</template>

<script>
import { io } from "socket.io-client";
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

export default {
  name: "WaitingRoom",
  props: ["username"],
  setup(props) {
    const router = useRouter();
    const route = useRoute();

    const user = {
      username: props.username || route.params.username,
      displayName: props.username || route.params.username,
    };

    const connectedUsers = ref([]);
    const socket = io("http://localhost:3000");

    // Solo Oscar puede iniciar
    const isOscar = computed(() => user.username?.toLowerCase() === "oscar");

    // Filtramos lista para que Oscar no aparezca
    const filteredUsers = computed(() =>
      connectedUsers.value.filter((u) => u.username?.toLowerCase() !== "oscar")
    );

    const startGame = () => {
      if (isOscar.value) {
        socket.emit("start-game");
      }
    };

    onMounted(() => {
      socket.emit("join", user);

      socket.on("connectedUsers", (users) => {
        connectedUsers.value = users;
      });

      socket.on("game-started", () => {
        router.push({
          name: "Game",
          params: {
            username: user.username, // 👈 Obligatorio porque está en la ruta
            user,
            connectedUsers: connectedUsers.value
          }
        });
      });
    });

    return { user, connectedUsers, filteredUsers, startGame, isOscar };
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

h1 {
  font-size: 48px;
  color: #000000;
  margin-top: 20px;
}

html,
body,
#app {
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: 'MiFuente', sans-serif;
}

.main {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  /* Título arriba, login abajo */
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #7edfa1, #32a852);
}

.welcome-message {
  font-size: 24px;
  margin-bottom: 20px;
  position: relative;
  top: -150px;
}

.waiting-room {
  max-width: 500px;
  margin: auto;
  text-align: center;
  ;
}

ul {
  list-style: none;
  padding: 0;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  cursor: pointer;
}
</style>
