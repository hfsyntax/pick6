
CREATE TABLE Seasons (
  season_id INT PRIMARY KEY AUTO_INCREMENT,
  season_number INT UNIQUE
);

CREATE TABLE Teams (
  team_id INT PRIMARY KEY AUTO_INCREMENT,
  team_name VARCHAR(50) UNIQUE
);

INSERT INTO Teams (team_name) VALUES
  ('Arizona Cardinals'),
  ('Atlanta Falcons'),
  ('Baltimore Ravens'),
  ('Buffalo Bills'),
  ('Carolina Panthers'),
  ('Chicago Bears'),
  ('Cincinnati Bengals'),
  ('Cleveland Browns'),
  ('Dallas Cowboys'),
  ('Denver Broncos'),
  ('Detroit Lions'),
  ('Green Bay Packers'),
  ('Houston Texans'),
  ('Indianapolis Colts'),
  ('Jacksonville Jaguars'),
  ('Kansas City Chiefs'),
  ('Las Vegas Raiders'),
  ('Los Angeles Chargers'),
  ('Los Angeles Rams'),
  ('Miami Dolphins'),
  ('Minnesota Vikings'),
  ('New England Patriots'),
  ('New Orleans Saints'),
  ('New York Giants'),
  ('New York Jets'),
  ('Philadelphia Eagles'),
  ('Pittsburgh Steelers'),
  ('San Francisco 49ers'),
  ('Seattle Seahawks'),
  ('Tampa Bay Buccaneers'),
  ('Tennessee Titans'),
  ('Push'),
  ('Washington Commanders');

CREATE TABLE Weeks (
  week_id INT PRIMARY KEY AUTO_INCREMENT,
  week_number INT,
  season_number INT,
  UNIQUE KEY (season_number, week_number),
  FOREIGN KEY (season_number) REFERENCES Seasons (season_number)
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
  underdog_score INT,
  UNIQUE KEY (season_number, week_number, favorite, underdog),
  FOREIGN KEY (season_number, week_number) REFERENCES Weeks (season_number, week_number),
  FOREIGN KEY (favorite) REFERENCES Teams (team_id),
  FOREIGN KEY (underdog) REFERENCES Teams (team_id),
  FOREIGN KEY (winner) REFERENCES Teams (team_id)
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
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  sha256 BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create the Players Table
CREATE TABLE Players (
  player_id INT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  gp VARCHAR(2),
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
  FOREIGN KEY (player_id) REFERENCES Players (player_id) ON DELETE CASCADE ,
  FOREIGN KEY (season_number, week_number) REFERENCES Weeks (season_number, week_number),
  UNIQUE KEY (player_id, season_number, week_number)
);

-- Create a new table to store historical player statistics
CREATE TABLE PlayerSeasonStats (
  stat_id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT,
  season_number INT,
  rank INT DEFAULT 0,
  won INT DEFAULT 0,
  lost INT DEFAULT 0,
  played INT DEFAULT 0,
  win_percentage DECIMAL(5, 2) DEFAULT 0,
  FOREIGN KEY (player_id) REFERENCES Players (player_id) ON DELETE CASCADE,
  FOREIGN KEY (season_number) REFERENCES Seasons (season_number),
  UNIQUE KEY (player_id, season_number)
);

-- Create the PlayerSelections Table
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

-- Create the Winners Table
CREATE TABLE Winners (
  winner_id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT,
  season_number INT,
  week_number INT,
  FOREIGN KEY (player_id) REFERENCES Players (player_id) ON DELETE CASCADE,
  FOREIGN KEY (season_number, week_number) REFERENCES Weeks (season_number, week_number),
  UNIQUE KEY (player_id, season_number, week_number)
);

-- Create the Losers Table
CREATE TABLE Losers (
  loser_id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT,
  season_number INT,
  week_number INT,
  FOREIGN KEY (player_id) REFERENCES Players (player_id) ON DELETE CASCADE,
  FOREIGN KEY (season_number, week_number) REFERENCES Weeks (season_number, week_number),
  UNIQUE KEY (player_id, season_number, week_number)
);
