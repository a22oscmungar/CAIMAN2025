<template>
  <div class="game-view">
    <h1>Pantalla de juego</h1>
    <p>Jugador: {{ user.displayName }}</p>

    <h3>Jugadores conectados:</h3>
    <ul>
      <li v-for="u in connectedUsers" :key="u.socketId">{{ u.displayName }}</li>
    </ul>

    <p>Aquí irá la lógica del juego (preguntas, respuestas, etc.)</p>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from "vue-router";

export default {
  name: "GameView",
  setup() {
    const route = useRoute();
    const username = route.params.username; // viene de /game/:username
    const user = route.params.user || { username, displayName: username };
    const connectedUsers = ref(route.params.connectedUsers || []);

    onMounted(() => {
      console.log("GameView montado con usuario:", user);
      console.log("Jugadores conectados:", connectedUsers.value);
    });

    return { user, connectedUsers };
  },
};
</script>

<style scoped>
.game-view {
  max-width: 600px;
  margin: auto;
  text-align: center;
}

ul {
  list-style: none;
  padding: 0;
}
</style>
