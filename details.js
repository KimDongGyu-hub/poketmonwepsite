window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const pokemonName = urlParams.get("name");
  if (pokemonName) {
    await fetchPokemonDetails(pokemonName);
  }
});

async function fetchPokemonDetails(name) {
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

  await fetchPokemonMoves(data.moves);
}

async function fetchPokemonMoves(moves) {
  const moveListElement = document.createElement("ul");
  const moveSection = document.createElement("div");
  moveSection.innerHTML = "<h3>사용 가능한 기술:</h3>";
  moveSection.appendChild(moveListElement);
  document.body.appendChild(moveSection);

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

    if (levelLearnedAt !== undefined) {
      const listItem = document.createElement("li");
      listItem.innerText = `레벨 ${levelLearnedAt}: ${koreanMoveName}`;
      moveListElement.appendChild(listItem);
    }
  }
}

async function getKoreanMoveName(names) {
  const koreanNameEntry = names.find((name) => name.language.name === "ko");
  return koreanNameEntry ? koreanNameEntry.name : "알 수 없는 기술";
}
