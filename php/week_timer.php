<?php
session_status() === PHP_SESSION_NONE ? session_start() : null;
class ConfigManager {
    private $config;

    public function __construct() {
        $this->config = $this->loadConfig();
    }

    private function loadConfig() {
        return parse_ini_file("");
    }

    private function saveConfig($config) {
        $configString = '';
        foreach ($config as $key => $value) {
            $value = '"' . str_replace('"', '\"', $value) . '"';
            $configString .= "$key=$value\n";
        }

        file_put_contents("", $configString);
    }

    public function getTimerState() {
        return $this->config['TIMER_PAUSED'];
    }

    public function getResetTime() {
        return $this->config['TARGET_RESET_TIME'];
    }

    public function getWeek() {
        return $this->config['CURRENT_WEEK'];
    }
    
    public function getSeason() {
        return $this->config['CURRENT_SEASON'];
    }

    public function stringTimerState() {
        return  $this->getTimerState() === '0' ? "unpaused" : "paused";
    }

    public function stringResetTime() {
        return date("Y-m-d H:i:s", $this->getResetTime());
    }

    public function setTimerState($newState) {
        if (isset($_SESSION["type"]) && $_SESSION["type"] === "admin") {
            $this->config['TIMER_PAUSED'] = $newState;
            $this->saveConfig($this->config);
        }
    }

    public function setTargetResetTime($targetResetTime) {
        if (isset($_SESSION["type"]) && $_SESSION["type"] === "admin") {
            $this->config['TARGET_RESET_TIME'] = $targetResetTime;
            $this->saveConfig($this->config);
        }
    }

    public function setWeek($week) {
        if (isset($_SESSION["type"]) && $_SESSION["type"] === "admin") {
            $this->config['CURRENT_WEEK'] = $week;
            $this->saveConfig($this->config);
        }
    }

    public function setSeason($season) {
        if (isset($_SESSION["type"]) && $_SESSION["type"] === "admin") {
            $this->config['CURRENT_SEASON'] = $season;
            $this->saveConfig($this->config);
        }
    }

    public function calculateTimeUntilResetInMilliseconds() {
        $targetResetTime = $this->getResetTime() > 0 ? $this->getResetTime() : strtotime('next sunday midnight');
        $currentTime = time();
        $timeUntilReset = ($targetResetTime - $currentTime) * 1000;
        return $timeUntilReset;
    } 
}
?>