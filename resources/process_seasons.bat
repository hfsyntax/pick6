@echo off
setlocal enabledelayedexpansion

set "batch_dir=%~dp0"
set "output_folder=%batch_dir%seasons"
set "destination_zip=%batch_dir%\seasons.zip" 

REM Remove existing "output" folder if it exists
if exist "%output_folder%" (
    rmdir /s /q "%output_folder%"
)

mkdir "%output_folder%"

pushd "%batch_dir%"

REM Remove existing zip file if it exists
if exist "%destination_zip%" (
    del "%destination_zip%"
)

for /d %%s in (*) do (
    pushd "%%s"

    for /d %%w in (*) do (
        pushd "%%w"

        REM Loop through files containing "Histo" in their names
        for %%f in (*Histo*) do (
            set "season_folder=%%s"
  
            REM Extract only the numeric part of the week folder and strip leading '0'
            set "week_folder=%%w"
            set "week_folder=!week_folder:~2!"
            if "!week_folder:~0,1!"=="0" set "week_folder=!week_folder:~1!"
            
            set "file_extension=.csv"

            set "picks_file=Week!week_folder!_!season_folder!_Picks_!file_extension!"
			set "games_file=Week!week_folder!_!season_folder!_Games_!file_extension!"
			            
            REM copy "%%f" "%output_folder%\!destination_file!" 
			!batch_dir!XlsToCsv "%%~dpnxf" "Picks" "%output_folder%\!picks_file!"
			echo created "%output_folder%\!picks_file!"
			!batch_dir!XlsToCsv "%%~dpnxf" "Games" "%output_folder%\!games_file!"
			echo created "%output_folder%\!games_file!"
        )

        popd
    )

    popd
)

REM Create a new zip file in the current directory
powershell Compress-Archive -Path "%output_folder%\*" -DestinationPath "%destination_zip%"

REM Delete the "output" folder
rmdir /s /q "%output_folder%"

popd

echo Zip file created successfully at %destination_zip%
