package com.phonexis.backend.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.annotation.PostConstruct;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.phonexis.backend.Entity.LearningModule;
import com.phonexis.backend.Entity.ModuleGame;
import com.phonexis.backend.Repository.LearningModuleRepository;
import com.phonexis.backend.Repository.ModuleGameRepository;

@Service
public class ModuleGameService {
	private final ModuleGameRepository moduleGameRepository;
	private final LearningModuleRepository learningModuleRepository;

	public ModuleGameService(ModuleGameRepository moduleGameRepository, LearningModuleRepository learningModuleRepository) {
		this.moduleGameRepository = moduleGameRepository;
		this.learningModuleRepository = learningModuleRepository;
	}

	@PostConstruct
	public void seedDefaultGames() {
		seedGame("alphabet", "alphabet-pretest-easy", "Pretest - EASY", "Alphabet recognition warm-up for A-M.", 1);
		seedGame("alphabet", "alphabet-pretest-medium", "Pretest - MEDIUM", "Alphabet recognition warm-up for N-Z.", 2);
		seedGame("alphabet", "alphabet-pretest-hard", "Pretest - HARD", "Alphabet recognition challenge for A-Z.", 3);
		seedGame("alphabet", "alphabet-alphaquest", "AlphaQuest", "Boss battle typing game for alphabet mastery.", 4);

		seedGame("vowels", "vowels-learning-materials", "Learning Materials", "Watch vowel videos and unlock the lesson path.", 1);
		seedGame("vowels", "vowels-lesson", "Lessons", "Practice vowel sounds with guided activities.", 2);
		seedGame("vowels", "vowels-pretest", "Pretest", "Check vowel recognition after the lesson track.", 3);
		seedGame("vowels", "vowels-vowelrush", "VowelRush", "Catch vowel stars in the rush mini-game.", 4);

		seedGame("consonants", "consonants-learning-materials", "Learning Materials", "Watch consonant videos before exploring.", 1);
		seedGame("consonants", "consonants-explore", "Explore", "Explore consonant sounds through the activity board.", 2);

		seedGame("cvc", "cvc-learning-materials", "Learning Materials", "Watch the CVC intro video to unlock word games.", 1);
		seedGame("cvc", "cvc-word-families", "Word Families", "Match CVC families and practice sound patterns.", 2);
		seedGame("cvc", "cvc-word-selection", "Word Selection", "Choose the correct CVC word.", 3);
		seedGame("cvc", "cvc-word-building", "Word Building", "Build the correct CVC word letter by letter.", 4);
	}

	@Transactional(readOnly = true)
	public List<ModuleGameResponse> listGames() {
		return moduleGameRepository.findAll(Sort.by(
			Sort.Order.asc("module.displayOrder"),
			Sort.Order.asc("displayOrder"),
			Sort.Order.asc("title")
		)).stream().map(ModuleGameResponse::new).toList();
	}

	@Transactional(readOnly = true)
	public List<ModuleGameResponse> listGamesByModule(String moduleKey) {
		String normalizedModuleKey = normalize(moduleKey);
		if (normalizedModuleKey.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Module key is required");
		}

		return moduleGameRepository.findByModuleModuleKeyIgnoreCaseOrderByDisplayOrderAscTitleAsc(normalizedModuleKey)
			.stream()
			.map(ModuleGameResponse::new)
			.toList();
	}

	@Transactional(readOnly = true)
	public ModuleGameResponse getGame(Long id) {
		return new ModuleGameResponse(getGameEntity(id));
	}

	@Transactional(readOnly = true)
	public ModuleGameResponse getGameByKey(String gameKey) {
		return new ModuleGameResponse(getGameEntityByKey(gameKey));
	}

	@Transactional
	public ModuleGameResponse createGame(CreateGameRequest request) {
		LearningModule module = getModuleEntity(request.moduleKey());
		String gameKey = normalize(request.gameKey());
		String title = normalizeTitle(request.title());
		String description = request.description() == null ? "" : request.description().trim();
		Integer displayOrder = request.displayOrder() == null ? 0 : request.displayOrder();

		if (gameKey.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game key is required");
		}

		if (title.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game title is required");
		}

		if (moduleGameRepository.existsByModuleAndGameKeyIgnoreCase(module, gameKey)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "A game with that key already exists for this module");
		}

		ModuleGame game = new ModuleGame();
		game.setModule(module);
		game.setGameKey(gameKey);
		game.setTitle(title);
		game.setDescription(description);
		game.setDisplayOrder(displayOrder);
		game.setActive(request.active() == null || request.active());

		return new ModuleGameResponse(moduleGameRepository.save(game));
	}

	@Transactional
	public ModuleGameResponse updateGame(Long id, UpdateGameRequest request) {
		ModuleGame game = getGameEntity(id);

		if (request.moduleKey() != null) {
			LearningModule module = getModuleEntity(request.moduleKey());
			String nextGameKey = request.gameKey() != null ? normalize(request.gameKey()) : game.getGameKey();
			if (moduleGameRepository.existsByModuleAndGameKeyIgnoreCaseAndGameIdNot(module, nextGameKey, id)) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "A game with that key already exists for this module");
			}
			game.setModule(module);
		}

		if (request.gameKey() != null) {
			String gameKey = normalize(request.gameKey());
			if (gameKey.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game key is required");
			}
			if (moduleGameRepository.existsByModuleAndGameKeyIgnoreCaseAndGameIdNot(game.getModule(), gameKey, id)) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "A game with that key already exists for this module");
			}
			game.setGameKey(gameKey);
		}

		if (request.title() != null) {
			String title = normalizeTitle(request.title());
			if (title.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game title is required");
			}
			game.setTitle(title);
		}

		if (request.description() != null) {
			game.setDescription(request.description().trim());
		}

		if (request.displayOrder() != null) {
			game.setDisplayOrder(request.displayOrder());
		}

		if (request.active() != null) {
			game.setActive(request.active());
		}

		return new ModuleGameResponse(moduleGameRepository.save(game));
	}

	@Transactional
	public void deleteGame(Long id) {
		moduleGameRepository.delete(getGameEntity(id));
	}

	private void seedGame(String moduleKey, String gameKey, String title, String description, int displayOrder) {
		LearningModule module = learningModuleRepository.findByModuleKeyIgnoreCase(moduleKey).orElse(null);
		if (module == null || moduleGameRepository.existsByModuleAndGameKeyIgnoreCase(module, gameKey)) {
			return;
		}

		ModuleGame game = new ModuleGame();
		game.setModule(module);
		game.setGameKey(gameKey);
		game.setTitle(title);
		game.setDescription(description);
		game.setDisplayOrder(displayOrder);
		game.setActive(true);
		moduleGameRepository.save(game);
	}

	private ModuleGame getGameEntity(Long id) {
		if (id == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game id is required");
		}

		return moduleGameRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));
	}

	private ModuleGame getGameEntityByKey(String gameKey) {
		String normalizedGameKey = normalize(gameKey);
		if (normalizedGameKey.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game key is required");
		}

		return moduleGameRepository.findByGameKeyIgnoreCase(normalizedGameKey)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));
	}

	private LearningModule getModuleEntity(String moduleKey) {
		String normalizedModuleKey = normalize(moduleKey);
		if (normalizedModuleKey.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Module key is required");
		}

		return learningModuleRepository.findByModuleKeyIgnoreCase(normalizedModuleKey)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
	}

	private String normalize(String value) {
		return value == null ? "" : value.trim().toLowerCase();
	}

	private String normalizeTitle(String value) {
		return value == null ? "" : value.trim();
	}

	public record CreateGameRequest(String moduleKey, String gameKey, String title, String description, Integer displayOrder, Boolean active) {
	}

	public record UpdateGameRequest(String moduleKey, String gameKey, String title, String description, Integer displayOrder, Boolean active) {
	}

	public record ModuleGameResponse(Long id, Long moduleId, String moduleKey, String moduleTitle, String gameKey, String title, String description, Integer displayOrder, Boolean active, java.time.LocalDateTime createdAt, java.time.LocalDateTime updatedAt, Map<String, Object> metadata) {
		public ModuleGameResponse(ModuleGame game) {
			this(
				game.getGameId(),
				game.getModule().getModuleId(),
				game.getModule().getModuleKey(),
				game.getModule().getTitle(),
				game.getGameKey(),
				game.getTitle(),
				game.getDescription(),
				game.getDisplayOrder(),
				game.getActive(),
				game.getCreatedAt(),
				game.getUpdatedAt(),
				buildMetadata(game)
			);
		}

		private static Map<String, Object> buildMetadata(ModuleGame game) {
			Map<String, Object> metadata = new LinkedHashMap<>();
			metadata.put("moduleKey", game.getModule().getModuleKey());
			metadata.put("moduleTitle", game.getModule().getTitle());
			metadata.put("gameKey", game.getGameKey());
			metadata.put("active", game.getActive());
			return metadata;
		}
	}
}