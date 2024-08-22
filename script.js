// ==========================================
// 전역 변수 설정
// ==========================================
const pokemonNameMap = {}; // 포켓몬 이름 매핑 객체
const maxPokemon = 493; // 4세대 포켓몬의 최대 번호 (493번까지)

// 로컬 저장소 키 설정
const POKEMON_NAME_MAP_KEY = "pokemonNameMap";

// ==========================================
// 초기화 및 이벤트 리스너 등록
// ==========================================
window.addEventListener("load", async () => {
  const storedNameMap = localStorage.getItem(POKEMON_NAME_MAP_KEY);
  if (storedNameMap) {
    Object.assign(pokemonNameMap, JSON.parse(storedNameMap));
    loadPokemonFromStorage(); // 저장된 데이터를 바로 로드
  } else {
    await fetchPokemonNames(); // 포켓몬 이름 데이터를 가져옴
    localStorage.setItem(POKEMON_NAME_MAP_KEY, JSON.stringify(pokemonNameMap));
    loadPokemonFromStorage(); // 가져온 데이터를 로드
  }

  // 모달 닫기 버튼 클릭 이벤트 추가
  document.getElementById("modal-close").addEventListener("click", closeModal);
});

// 검색창에 입력된 값이 변경될 때마다 필터링된 포켓몬을 표시
document
  .getElementById("pokemon-input")
  .addEventListener("input", filterPokemonList);

// ==========================================
// 포켓몬 데이터 로드 함수
// ==========================================

// PokeAPI에서 포켓몬 이름과 번호 데이터를 가져와서 저장하는 함수
async function fetchPokemonNames() {
  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species?limit=${maxPokemon}`;

  try {
    const response = await fetch(speciesUrl);
    const data = await response.json();

    // 각 포켓몬의 종(species) 정보를 가져와서 이름을 매핑
    const promises = data.results.map(async (pokemon, index) => {
      const res = await fetch(pokemon.url);
      const speciesData = await res.json();

      const pokemonNumber = index + 1;
      pokemonNameMap[pokemon.name] = {
        englishName: speciesData.name,
        number: pokemonNumber,
        koreanName: speciesData.name, // 영어 이름 그대로 사용
      };
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("포켓몬 이름 데이터를 가져오는 중 오류 발생:", error);
  }
}

// 로컬 저장소에서 로드한 포켓몬 데이터를 화면에 표시하는 함수
function loadPokemonFromStorage() {
  const pokemonListContainer = document.getElementById("pokemon-list");
  pokemonListContainer.innerHTML = ""; // 기존에 표시된 포켓몬 리스트 초기화

  Object.values(pokemonNameMap).forEach((pokemon) => {
    console.log(pokemon.number);
    const pokemonCard = document.createElement("div");
    pokemonCard.classList.add("pokemon-card");
    pokemonCard.setAttribute("data-name", pokemon.englishName);
    pokemonCard.innerHTML = `
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.number}.png" alt="${pokemon.englishName}">
            <p>#${pokemon.number} ${pokemon.englishName}</p>
        `;
    pokemonCard.addEventListener("click", () => {
      openPokemonDetails(pokemon.englishName);
    });
    pokemonListContainer.appendChild(pokemonCard);
  });
}

// ==========================================
// 검색 기능 구현
// ==========================================
function filterPokemonList() {
  const searchInput = document.getElementById("pokemon-input").value.trim();
  const pokemonListContainer = document.getElementById("pokemon-list");

  if (searchInput === "") {
    loadPokemonFromStorage();
    return;
  }

  pokemonListContainer.innerHTML = "";

  const filteredPokemon = Object.values(pokemonNameMap).filter((pokemon) =>
    pokemon.englishName.includes(searchInput)
  );

  filteredPokemon.forEach((pokemon) => {
    const pokemonCard = document.createElement("div");
    pokemonCard.classList.add("pokemon-card");
    pokemonCard.setAttribute("data-name", pokemon.englishName);
    pokemonCard.innerHTML = `
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.number}.png" alt="${pokemon.englishName}">
            <p>#${pokemon.number} ${pokemon.englishName}</p>
        `;
    pokemonCard.addEventListener("click", () => {
      openPokemonDetails(pokemon.englishName);
    });
    pokemonListContainer.appendChild(pokemonCard);
  });
}

// ==========================================
// 포켓몬 상세 정보 표시
// ==========================================
async function openPokemonDetails(name) {
  const url = `https://pokeapi.co/api/v2/pokemon/${name}`;
  const response = await fetch(url);
  const data = await response.json();

  displayPokemonDetails(data);
}

// 포켓몬의 상세 정보를 모달 창에 표시하는 함수
function displayPokemonDetails(data) {
  const pokemonNumber = data.id;
  const pokemonImage = data.sprites.front_default;
  const pokemonTypes = data.types
    .map((typeInfo) => typeInfo.type.name)
    .join(", ");
  const pokemonHeight = data.height / 10;
  const pokemonWeight = data.weight / 10;

  document.getElementById(
    "pokemon-name"
  ).innerText = `#${pokemonNumber} ${data.name}`;
  document.getElementById("pokemon-image").src = pokemonImage;
  document.getElementById(
    "pokemon-info"
  ).innerText = `Type: ${pokemonTypes}\nHeight: ${pokemonHeight}m\nWeight: ${pokemonWeight}kg`;

  fetchPokemonMoves(data.moves);
  openModal();
}
/* 제발해줘 해줘 제발*/
// ==========================================
// 포켓몬 기술 정보 표시
// ==========================================
async function fetchPokemonMoves(moves) {
  const moveListElement = document.getElementById("pokemon-moves");
  moveListElement.innerHTML = "<h3>Available Moves:</h3>";

  const uniqueMoves = new Map();

  for (const move of moves) {
    const moveUrl = move.move.url;
    const response = await fetch(moveUrl);
    const moveData = await response.json();

    const moveName = moveData.name;
    const levelLearnedAt = move.version_group_details.find(
      (detail) =>
        detail.version_group.name === "sword-shield" &&
        detail.move_learn_method.name === "level-up"
    )?.level_learned_at;

    if (levelLearnedAt !== undefined && levelLearnedAt <= 99) {
      uniqueMoves.set(moveName, levelLearnedAt);
    }
  }

  [...uniqueMoves.entries()]
    .sort((a, b) => a[1] - b[1])
    .forEach(([moveName, levelLearnedAt]) => {
      const listItem = document.createElement("p");
      listItem.innerText = `Level ${levelLearnedAt}: ${moveName}`;
      moveListElement.appendChild(listItem);
    });
}

// ==========================================
// 모달 창 제어 살려줘
// ==========================================
function openModal() {
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}
