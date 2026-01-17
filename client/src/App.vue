<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// App.vue 现在只负责渲染路由视图
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.el-menu-vertical {
  height: 100vh;
}
</style>
