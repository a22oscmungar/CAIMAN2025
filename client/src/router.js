import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './components/LoginView.vue';
import WaitingRoom from './components/WaitingRoom.vue';
import GameView from './components/GameView.vue';

const routes = [
  { path: '/', name: 'Login', component: LoginView },
  {
  path: '/waiting/:username',
  name: 'WaitingRoom',
  component: WaitingRoom,
  props: true
},
  {
  path: "/game/:username",
  name: "Game",
  component: GameView
}
];

export default createRouter({
  history: createWebHistory(),
  routes
});