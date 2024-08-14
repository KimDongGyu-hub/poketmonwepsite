const pokemonNameMap = {}; // 포켓몬 이름 매핑 객체
let offset = 1; // 현재 로드된 포켓몬의 시작 번호
const limit = 20; // 한 번에 로드할 포켓몬 수
let isLoading = false; // 로딩 중인지 여부

window.addEventListener("load", async () => {
  console.log("사이트 로드 완료. 포켓몬 이름 로딩 시작.");
  await fetchPokemonNames();
  console.log("포켓몬 이름 로딩 완료. 첫 번째 포켓몬 로딩 시작.");
  loadPokemon(); // 첫 번째 포켓몬 로딩
});

document
  .getElementById("search-button")
  .addEventListener("click", searchPokemon);

async function fetchPokemonNames() {
  const speciesUrl = "https://pokeapi.co/api/v2/pokemon-species?limit=1010";

  try {
    const response = await fetch(speciesUrl);
    const data = await response.json();

    const promises = data.results.map(async (pokemon, index) => {
      const res = await fetch(pokemon.url);
      const speciesData = await res.json();
      const koreanEntry = speciesData.names.find(
        (name) => name.language.name === "ko"
      );

      if (koreanEntry) {
        const pokemonNumber = index + 1;
        pokemonNameMap[koreanEntry.name] = {
          englishName: speciesData.name,
          number: pokemonNumber,
          koreanName: koreanEntry.name,
        };
      }
    });

    await Promise.all(promises); // 모든 이름을 가져올 때까지 대기
    console.log("포켓몬 이름 데이터 가져오기 성공");
  } catch (error) {
    console.error("포켓몬 이름 데이터를 가져오는 중 오류 발생:", error);
  }
}

async function loadPokemon() {
  if (isLoading) return;
  isLoading = true;

  const pokemonListContainer = document.getElementById("pokemon-list");
  console.log(`포켓몬 ${offset}번부터 ${offset + limit - 1}번까지 로드 중...`);

  for (let i = offset; i < offset + limit && i <= 1010; i++) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const pokemonData = await response.json();
      const koreanName = Object.keys(pokemonNameMap).find(
        (key) => pokemonNameMap[key].englishName === pokemonData.name
      );
      const pokemonNumber = pokemonNameMap[koreanName].number;

      const pokemonCard = document.createElement("div");
      pokemonCard.classList.add("pokemon-card");
      pokemonCard.setAttribute("data-name", pokemonData.name);
      pokemonCard.innerHTML = `
                <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
                <p>#${pokemonNumber} ${koreanName}</p>
            `;

      pokemonCard.addEventListener("click", () => {
        openPokemonDetails(pokemonData.name);
      });

      pokemonListContainer.appendChild(pokemonCard);
    } catch (error) {
      console.error(`포켓몬 ${i}번을 가져오는 중 오류 발생:`, error);
    }
  }

  offset += limit;
  isLoading = false;

  // 마지막 포켓몬을 성공적으로 로드한 후에만 observeLastPokemon 호출
  if (offset <= 1010) {
    observeLastPokemon();
  }
}

function observeLastPokemon() {
  const lastPokemon = document.querySelector(
    "#pokemon-list .pokemon-card:last-child"
  );
  if (!lastPokemon) {
    console.log("마지막 포켓몬 카드가 없습니다.");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect(); // 중복 호출 방지
        loadPokemon();
      }
    },
    { threshold: 1 }
  );

  observer.observe(lastPokemon);
  console.log("마지막 포켓몬 카드 관찰 시작.");
}

function searchPokemon() {
  const koreanName = document
    .getElementById("pokemon-input")
    .value.trim()
    .toLowerCase();
  const pokemonData = pokemonNameMap[koreanName];

  if (pokemonData) {
    openPokemonDetails(pokemonData.englishName);
  } else {
    alert("해당 포켓몬을 찾을 수 없습니다.");
  }
}

function openPokemonDetails(name) {
  // 새로운 창을 열고, 이름을 URL에 쿼리 파라미터로 전달
  window.open(`details.html?name=${name}`, "_blank"); // 새로운 창에서 열기
}
