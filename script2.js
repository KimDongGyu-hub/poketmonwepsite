const pokemonNameMap = {}; // 포켓몬 이름 매핑 객체
let offset = 1; // 현재 로드된 포켓몬의 시작 번호
const limit = 20; // 한 번에 로드할 포켓몬 수
let isLoading = false; // 로딩 중인지 여부

window.addEventListener("load", async () => {
  await fetchPokemonNames();
  loadPokemon(); // 첫 번째 포켓몬 로딩

  // 모달 닫기 버튼 클릭 이벤트 추가
  document.getElementById("modal-close").addEventListener("click", closeModal);
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

    await Promise.all(promises);
  } catch (error) {
    console.error("포켓몬 이름 데이터를 가져오는 중 오류 발생:", error);
  }
}

async function loadPokemon() {
  if (isLoading) return;
  isLoading = true;

  const pokemonListContainer = document.getElementById("pokemon-list");

  for (let i = offset; i < offset + limit && i <= 799; i++) {
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
  if (!lastPokemon) return;

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

async function openPokemonDetails(name) {
  const url = `https://pokeapi.co/api/v2/pokemon/${name}`;
  const response = await fetch(url);
  const data = await response.json();

  displayPokemonDetails(data);
}

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

  document.getElementById(
    "pokemon-name"
  ).innerText = `#${pokemonNumber} ${koreanName}`;
  document.getElementById("pokemon-image").src = pokemonImage;
  document.getElementById(
    "pokemon-info"
  ).innerText = `타입: ${pokemonTypes}\n높이: ${pokemonHeight}m\n무게: ${pokemonWeight}kg`;

  // 기술 정보를 병렬로 가져오기
  await fetchPokemonMoves(data.moves);

  // 모달 열기
  openModal();
}

async function fetchPokemonMoves(moves) {
  const moveListElement = document.getElementById("pokemon-moves");
  moveListElement.innerHTML = ""; // 기존 리스트 초기화
  moveListElement.innerHTML = "<h3>사용 가능한 기술:</h3>";

  // 기술 정보를 병렬로 가져옴
  const movePromises = moves.map(async (move) => {
    const moveUrl = move.move.url;
    const response = await fetch(moveUrl);
    const moveData = await response.json();

    const koreanMoveName = await getKoreanMoveName(moveData.names);
    const levelLearnedAt = move.version_group_details.find(
      (detail) =>
        detail.version_group.name === "sword-shield" &&
        detail.move_learn_method.name === "level-up"
    )?.level_learned_at;

    return { koreanMoveName, levelLearnedAt };
  });

  const moveDetails = await Promise.all(movePromises);

  // 필터링 후 레벨 1부터 99까지 정렬하여 기술을 리스트로 표시
  moveDetails
    .filter(
      (detail) =>
        detail.levelLearnedAt !== undefined && detail.levelLearnedAt <= 99
    )
    .sort((a, b) => a.levelLearnedAt - b.levelLearnedAt)
    .forEach((detail) => {
      const listItem = document.createElement("p");
      listItem.innerText = `레벨 ${detail.levelLearnedAt}: ${detail.koreanMoveName}`;
      moveListElement.appendChild(listItem);
    });
}

async function getKoreanMoveName(names) {
  const koreanNameEntry = names.find((name) => name.language.name === "ko");
  return koreanNameEntry ? koreanNameEntry.name : "알 수 없는 기술";
}

function openModal() {
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}
