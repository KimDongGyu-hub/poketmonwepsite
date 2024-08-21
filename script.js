// ==========================================
// 전역 변수 설정
// ==========================================
const pokemonNameMap = {}; // 포켓몬 이름 매핑 객체
let offset = 1; // 현재 로드된 포켓몬의 시작 번호
const limit = 20; // 한 번에 로드할 포켓몬 수
let isLoading = false; // 로딩 중인지 여부

// ==========================================
// 초기화 및 이벤트 리스너 등록
// ==========================================
window.addEventListener("load", async () => {
  await fetchPokemonNames(); // 포켓몬 이름 데이터를 가져옴
  loadPokemon(); // 첫 번째 포켓몬들을 화면에 로드

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
  const speciesUrl = "https://pokeapi.co/api/v2/pokemon-species?limit=1010";

  try {
    const response = await fetch(speciesUrl);
    const data = await response.json();

    // 각 포켓몬의 종(species) 정보를 가져와서 이름을 매핑
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

    // 모든 이름 데이터를 가져올 때까지 대기
    await Promise.all(promises);
  } catch (error) {
    console.error("포켓몬 이름 데이터를 가져오는 중 오류 발생:", error);
  }
}

// 초기 로드 시 기본 포켓몬 리스트를 가져와 화면에 표시하는 함수
async function loadPokemon() {
  if (isLoading) return; // 이미 로딩 중이면 중복 로딩 방지
  isLoading = true; // 로딩 상태 설정

  const pokemonListContainer = document.getElementById("pokemon-list");

  // 오프셋(offset)부터 limit만큼의 포켓몬 데이터를 가져옴
  for (let i = offset; i < offset + limit && i <= 151; i++) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const pokemonData = await response.json();
      const koreanName = Object.keys(pokemonNameMap).find(
        (key) => pokemonNameMap[key].englishName === pokemonData.name
      );
      const pokemonNumber = pokemonNameMap[koreanName].number;

      // 포켓몬 카드를 생성하여 리스트에 추가
      const pokemonCard = document.createElement("div");
      pokemonCard.classList.add("pokemon-card");
      pokemonCard.setAttribute("data-name", pokemonData.name);
      pokemonCard.innerHTML = `
                <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
                <p>#${pokemonNumber} ${koreanName}</p>
            `;

      // 포켓몬 카드를 클릭하면 상세 정보를 표시
      pokemonCard.addEventListener("click", () => {
        openPokemonDetails(pokemonData.name);
      });

      pokemonListContainer.appendChild(pokemonCard);
    } catch (error) {
      console.error(`포켓몬 ${i}번을 가져오는 중 오류 발생:`, error);
    }
  }

  offset += limit; // 다음 로드 시작 위치 설정
  isLoading = false; // 로딩 상태 해제

  // 마지막 포켓몬이 로드되면 다음 로드를 준비
  if (offset <= 1010) {
    observeLastPokemon();
  }
}

// ==========================================
// 검색 기능 구현
// ==========================================

// 검색창에 입력된 텍스트가 포함된 포켓몬만 필터링하여 화면에 표시하는 함수
function filterPokemonList() {
  const searchInput = document.getElementById("pokemon-input").value.trim(); // 입력된 검색어
  const pokemonListContainer = document.getElementById("pokemon-list");
  pokemonListContainer.innerHTML = ""; // 기존에 표시된 포켓몬 리스트 초기화

  if (searchInput === "") {
    loadPokemon(); // 검색어가 없을 경우 기본 로드 수행
    return;
  }

  // 검색어가 포함된 포켓몬만 필터링
  const filteredPokemon = Object.values(pokemonNameMap).filter((pokemon) =>
    pokemon.koreanName.includes(searchInput)
  );

  // 필터링된 포켓몬들을 화면에 출력
  filteredPokemon.forEach((pokemon) => {
    const pokemonCard = document.createElement("div");
    pokemonCard.classList.add("pokemon-card");
    pokemonCard.setAttribute("data-name", pokemon.englishName);
    pokemonCard.innerHTML = `
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.number}.png" alt="${pokemon.koreanName}">
                <p>#${pokemon.number} ${pokemon.koreanName}</p>
            `;
    pokemonCard.addEventListener("click", () => {
      openPokemonDetails(pokemon.englishName);
    });
    pokemonListContainer.appendChild(pokemonCard);
  });
}

// ==========================================
// 자동 로드 기능 구현
// ==========================================

// 마지막 포켓몬을 관찰하여 자동으로 추가 포켓몬을 로드하는 함수
function observeLastPokemon() {
  const lastPokemon = document.querySelector(
    "#pokemon-list .pokemon-card:last-child"
  );
  if (!lastPokemon) return; // 마지막 포켓몬이 없을 경우 종료

  // 마지막 포켓몬이 뷰포트에 들어올 때 추가 포켓몬을 로드
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
}

// ==========================================
// 포켓몬 상세 정보 표시
// ==========================================

// 포켓몬의 이름으로 PokeAPI에서 상세 정보를 가져와 모달 창에 표시하는 함수
async function openPokemonDetails(name) {
  const url = `https://pokeapi.co/api/v2/pokemon/${name}`;
  const response = await fetch(url);
  const data = await response.json();

  displayPokemonDetails(data);
}

// 포켓몬의 상세 정보를 모달 창에 표시하는 함수
async function displayPokemonDetails(data) {
  const pokemonNameMap = {
    bulbasaur: "이상해씨",
    pikachu: "피카츄",
    charmander: "파이리",
    // 여기에 더 많은 이름 매핑을 추가할 수 있습니다.
  };

  const typeMap = {
    normal: "노말",
    fire: "불꽃",
    water: "물",
    grass: "풀",
    electric: "전기",
    ice: "얼음",
    fighting: "격투",
    poison: "독",
    ground: "땅",
    flying: "비행",
    psychic: "에스퍼",
    bug: "벌레",
    rock: "바위",
    ghost: "고스트",
    dragon: "드래곤",
    dark: "악",
    steel: "강철",
    fairy: "페어리",
    // 필요한 다른 타입들을 추가
  };

  const koreanName = pokemonNameMap[data.name] || data.name.toUpperCase();
  const pokemonNumber = data.id;
  const pokemonImage = data.sprites.front_default;
  const pokemonTypes = data.types
    .map((typeInfo) => typeMap[typeInfo.type.name] || typeInfo.type.name)
    .join(", ");
  const pokemonHeight = data.height / 10;
  const pokemonWeight = data.weight / 10;

  // 모달 창에 포켓몬의 기본 정보 출력
  document.getElementById(
    "pokemon-name"
  ).innerText = `#${pokemonNumber} ${koreanName}`;
  document.getElementById("pokemon-image").src = pokemonImage;
  document.getElementById(
    "pokemon-info"
  ).innerText = `타입: ${pokemonTypes}\n높이: ${pokemonHeight}m\n무게: ${pokemonWeight}kg`;

  // 포켓몬의 사용 가능한 기술 정보를 가져와 모달에 출력
  await fetchPokemonMoves(data.moves);

  // 모달 열기
  openModal();
}

// ==========================================
// 포켓몬 기술 정보 표시
// ==========================================

// 포켓몬이 배울 수 있는 기술 정보를 가져와 모달 창에 표시하는 함수
async function fetchPokemonMoves(moves) {
  const moveListElement = document.getElementById("pokemon-moves");
  moveListElement.innerHTML = ""; // 기존 리스트 초기화
  moveListElement.innerHTML = "<h3>사용 가능한 기술:</h3>";

  // 중복된 기술을 제거하기 위해 Map 사용
  const uniqueMoves = new Map();

  // 각 기술 정보를 PokeAPI에서 가져옴
  for (const move of moves) {
    const moveUrl = move.move.url;
    const response = await fetch(moveUrl);
    const moveData = await response.json();

    const koreanMoveName = await getKoreanMoveName(moveData.names);
    const levelLearnedAt = move.version_group_details.find(
      (detail) =>
        detail.version_group.name === "sword-shield" &&
        detail.move_learn_method.name === "level-up"
    )?.level_learned_at;

    // 99레벨 이하의 중복되지 않은 기술만 추가
    if (levelLearnedAt !== undefined && levelLearnedAt <= 99) {
      uniqueMoves.set(koreanMoveName, levelLearnedAt);
    }
  }

  // 레벨 순서대로 정렬 후 출력
  [...uniqueMoves.entries()]
    .sort((a, b) => a[1] - b[1])
    .forEach(([koreanMoveName, levelLearnedAt]) => {
      const listItem = document.createElement("p");
      listItem.innerText = `레벨 ${levelLearnedAt}: ${koreanMoveName}`;
      moveListElement.appendChild(listItem);
    });
}

// PokeAPI에서 기술의 한글 이름을 가져오는 함수
async function getKoreanMoveName(names) {
  const koreanNameEntry = names.find((name) => name.language.name === "ko");
  return koreanNameEntry ? koreanNameEntry.name : "알 수 없는 기술";
}

// ==========================================
// 모달 창 제어
// ==========================================

// 모달 창을 열어 포켓몬 정보를 표시하는 함수
function openModal() {
  document.getElementById("modal").style.display = "block";
}

// 모달 창을 닫는 함수
function closeModal() {
  document.getElementById("modal").style.display = "none";
}
