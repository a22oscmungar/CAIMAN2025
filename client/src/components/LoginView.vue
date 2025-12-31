<template>
  <div class="main">
    <!-- Pantalla de bienvenida -->
    <div v-if="!showLogin" class="welcome-screen">
      <h1 class="main-title">Bienvenidos al Test del Caimán 2025</h1>
      <img src="../assets/caiman-welcome.png" alt="Logo Caimán" class="logo" />
      <button @click="showLogin = true" class="start-btn">Iniciar Sesión</button>
    </div>

    <!-- Formulario de login -->
    <div v-else class="login-container">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div>
          <input v-model="username" type="text" placeholder="Usuario" required />
        </div>
        <div>
          <input v-model="password" type="password" placeholder="Contraseña" required />
        </div>
        <button type="submit">Entrar</button>
      </form>
      <p v-if="error" style="color:red">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { BACKEND_URL } from "@/config";

export default {
  name: "LoginView",
  setup() {
    const router = useRouter();
    const username = ref("");
    const password = ref("");
    const error = ref("");
    const showLogin = ref(false);

    const handleLogin = async () => {
      try {
        const res = await axios.post(`${BACKEND_URL}/login`, {
          username: username.value,
          password: password.value,
        });

        if (res.data.ok) {
          const user = res.data.user;
          router.push({ name: "WaitingRoom", params: { username: user.username } });
        } else {
          error.value = res.data.msg || "Error de login";
        }
      } catch (err) {
        console.error(err);
        error.value = "No se pudo conectar al servidor";
      }
    };

    return { username, password, error, handleLogin, showLogin };
  },
};
</script>

<style scoped>
@font-face {
  font-family: 'RoyaltyFree';
  src: url('../assets/fonts/RoyaltyFree.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'RoyaltyFree';
  src: url('../assets/fonts/RoyaltyFree.ttf') format('openType');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'DirtyLane';
  src: url('../assets/fonts/DirtyLane.otf') format('openType');
  font-weight: normal;
  font-style: normal;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
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

.main-title {
  font-size: clamp(1.8rem, 6vw, 3rem);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, .4);
  color: #ffffff;
  font-family: 'DirtyLane', sans-serif;
  text-align: center;
  margin-bottom: 12px;
}

.logo {
  max-width: 80vw;
  max-height: 30vh;
  object-fit: contain;
  margin: 12px 0;
  margin-left: 10%;
  

  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%);
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%);
}

.login-container {
  width: 100%;
  max-width: 340px;
  background-color: #fff;
  padding: 16px;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, .15);
  text-align: center;
}

input,
button {
  width: 100%;
  margin: 12px 0;
  padding: 14px;
  font-size: 1rem;
  border-radius: 8px;
}

button {
  cursor: pointer;
}

.start-btn {
  background: white;
  color: #32a852;
  font-size: 1.1rem;
  font-weight: bold;
  padding: 14px 26px;
  border-radius: 10px;
  border: none;
}
</style>
