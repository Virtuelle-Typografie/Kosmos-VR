<template>
  <div class="home">
    <div class="container">
      <div class="grid-x">
        <div class="columns small-12">
          <h1>Kosmos</h1>
          <h3>Eine Reise durch den Wort-Kosmos der deutschen Sprache. </h3>
          <p>
            Wir haben Wörter in einem dreidimensionalen Netz visualisiert. Die Entfernung zwischen einzelnen Wörtern beschreibt ihre Beziehung zueinander. Also, je näher Wörter bei einander sind, desto häufiger werden sie miteinander verwendet. 
          </p>
          <p>
            Du kannst mithilfe deines Computers, Smartphones oder deiner VR-Brille durch diesen Ausschnitt unserer Sprache navigieren. Dabei wirst du schnell feststellen, wie umfangreich und vielseitig die deutsche Sprache sein kann. Vielleicht gibt es auch noch etwas für dich zu entdecken. Also Zeit, selbst zu erkunden!
          </p>
          <p>
            Ein Projekt von Felix Tesche und Pascal Struck. 
          </p>
          <router-link to="/network">
            <button class="btn">
              <img src="../assets/img/explore.svg"/>
              <span>Erkunden</span>
            </button>
          </router-link>
        </div>
      </div>
    </div>
    <!-- <div id="nav">
      <router-link to="/network">Network</router-link>
    </div> -->
    
  </div>
</template>

<style lang="scss">
  @import '../scss/foundation';

  body {
    background: #000000;
  }

  .home {
    height: 100vh;
    background: url("../assets/img/background.png");
    background-size: cover;

    padding: 5rem 0 5rem 0;
  }

  .container {
    max-width: 920px;
    margin: 0 auto;
  }

  a {
    text-decoration: none;
  }

  .btn {
    font-family: 'FranziskaProDemibold';
    font-size: 24px;
    font-style: normal;
    padding: 0.75rem 1.25rem;
    color: #fff;
    border: 2px solid #fff;
    border-radius: 0;

    display: flex;
    justify-content: center;
    align-items: center;

    margin: 0 auto;

    span {
      text-decoration: none;
    }
    
    & img {
      padding-right: .5rem;
    }
  }
</style>
