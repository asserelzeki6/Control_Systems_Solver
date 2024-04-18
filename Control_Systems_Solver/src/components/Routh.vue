<template>
  <div>
    <label>Coefficients of characteristic equation:</label>
    <input v-model="coefficientsString" type="text" placeholder="Enter coefficients separated by commas" @change="calculateStability">
    <div v-if="stabilityResult !== null">
      <p v-if="stabilityResult">System is stable.</p>
      <p v-else>System is unstable.</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      coefficientsString: '',
      stabilityResult: null
    };
  },
  methods: {
    calculateStability() {
      const coefficients = this.coefficientsString.split(',').map(parseFloat);
      const n = coefficients.length - 1;
      if (n <= 0 || coefficients.some(isNaN)) {
        this.stabilityResult = null;
        return;
      }

      const routhArray = [];
      for (let i = 0; i <= n; i++) {
        routhArray.push([]);
      }

      for (let i = 0; i <= n; i += 2) {
        routhArray[0].push(coefficients[i]);
      }

      for (let i = 1; i <= n; i++) {
        for (let j = 0; j <= n - i; j++) {
          const a = routhArray[i - 1][0];
          const b = routhArray[i - 1][j + 1];
          const c = routhArray[i - 2][0];
          const d = routhArray[i - 2][j + 1];
          routhArray[i].push((a * b - c * d) / a);
        }
      }
      this.stabilityResult = routhArray.every(row => row[0] > 0);
    }
  }
}
</script>

<style scoped>
/* Your component-specific styles go here */
label{
    font-size: 20px;
    margin: 5pxm 0;
    color: brown;
}
input{
    padding: 5px;
    margin: 5px 0;
    width: 100%;
    font-size: 16px;
}
p{
    font-size: 20px;
    margin: 5px 0;
}
div{
    margin: 10px 0;
}
</style>
