-- Create the Seasons Table
CREATE TABLE Seasons (
  season_id INT PRIMARY KEY AUTO_INCREMENT,
  season_number INT UNIQUE
);

-- Create the Teams Table
CREATE TABLE Teams (
  team_id INT PRIMARY KEY AUTO_INCREMENT,
  team_name VARCHAR(50) UNIQUE
);

INSERT INTO Teams (team_name) VALUES
  ('Cardinals'),
  ('Falcons'),
  ('Ravens'),
  ('Bills'),
  ('Panthers'),
  ('Bears'),
  ('Bengals'),
  ('Browns'),
  ('Cowboys'),
  ('Broncos'),
  ('Lions'),
  ('Packers'),
  ('Texans'),
  ('Colts'),
  ('Jaguars'),
  ('Chiefs'),
  ('Raiders'),
  ('Chargers'),
  ('Rams'),
  ('Dolphins'),
  ('Vikings'),
  ('Patriots'),
  ('Saints'),
  ('Giants'),
  ('Jets'),
  ('Eagles'),
  ('Steelers'),
  ('49ers'),
  ('Seahawks'),
  ('Buccaneers'),
  ('Titans'),
  ('Push'),
  ('Commanders');

CREATE TABLE Weeks (
  week_id INT PRIMARY KEY AUTO_INCREMENT,
  week_number INT,
  season_number INT,
  UNIQUE KEY (season_number, week_number),
  FOREIGN KEY (season_number) REFERENCES Seasons (season_number) ON DELETE CASCADE
);

CREATE TABLE Games (
  game_id INT PRIMARY KEY AUTO_INCREMENT,
  season_number INT,
  week_number INT,
  favorite INT,
  spread DECIMAL(5, 2),
  underdog INT,
  winner INT,
  favorite_score INT,
  underdog_score INT,
  UNIQUE KEY (season_number, week_number, favorite, underdog),
  FOREIGN KEY (season_number, week_number) REFERENCES Weeks (season_number, week_number),
  FOREIGN KEY (favorite) REFERENCES Teams (team_id),
  FOREIGN KEY (underdog) REFERENCES Teams (team_id),
  FOREIGN KEY (winner) REFERENCES Teams (team_id)
);

-- Create temp Games Table to process teams that won
CREATE TABLE TempGames (
  game_id INT PRIMARY KEY AUTO_INCREMENT,
  season_number INT,
  week_number INT,
  favorite INT,
  underdog INT,
  winner INT,
  favorite_score INT,
  underdog_score INT
);

CREATE TABLE PlayerAuth (
  auth_id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(16) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  sha256 BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

/* Create temporary PlayerAuth Table
 check if bulk playerauth entries already exist
*/
CREATE TABLE TempPlayerAuth (
  auth_id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(16),
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  sha256 BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Players (
  player_id INT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  gp VARCHAR(2) NOT NULL,
  group_number INT NOT NULL,
  picture_url VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (player_id) REFERENCES PlayerAuth (auth_id) ON DELETE CASCADE
);

CREATE TABLE PlayerWeekStats (
  stat_id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT,
  season_number INT,
  week_number INT,
  rank INT DEFAULT 0,
  won INT DEFAULT 0,
  lost INT DEFAULT 0,
  played INT DEFAULT 0,
  win_percentage DECIMAL(5, 2) DEFAULT 0,
  gp VARCHAR(2) NOT NULL,
  group_number INT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES Players (player_id) ON DELETE CASCADE ,
  FOREIGN KEY (season_number, week_number) REFERENCES Weeks (season_number, week_number),
  UNIQUE KEY (player_id, season_number, week_number)
);

CREATE TABLE PlayerSeasonStats (
  stat_id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT,
  season_number INT,
  rank INT DEFAULT 0,
  won INT DEFAULT 0,
  lost INT DEFAULT 0,
  played INT DEFAULT 0,
  win_percentage DECIMAL(5, 2) DEFAULT 0,
  gp VARCHAR(2) NOT NULL,
  group_number INT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES Players (player_id) ON DELETE CASCADE,
  FOREIGN KEY (season_number) REFERENCES Seasons (season_number),
  UNIQUE KEY (player_id, season_number)
);

CREATE TABLE PlayerSelections (
  selection_id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT,
  game_id INT,
  selected_team_id INT,
  FOREIGN KEY (player_id) REFERENCES Players (player_id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES Games (game_id),
  FOREIGN KEY (selected_team_id) REFERENCES Teams (team_id),
  UNIQUE KEY (player_id, game_id)
);

CREATE TABLE Winners (
  winner_id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT,
  season_number INT,
  week_number INT,
  FOREIGN KEY (player_id) REFERENCES Players (player_id) ON DELETE CASCADE,
  FOREIGN KEY (season_number, week_number) REFERENCES Weeks (season_number, week_number),
  UNIQUE KEY (player_id, season_number, week_number)
);

CREATE TABLE Losers (
  loser_id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT,
  season_number INT,
  week_number INT,
  FOREIGN KEY (player_id) REFERENCES Players (player_id) ON DELETE CASCADE,
  FOREIGN KEY (season_number, week_number) REFERENCES Weeks (season_number, week_number),
  UNIQUE KEY (player_id, season_number, week_number)
);
