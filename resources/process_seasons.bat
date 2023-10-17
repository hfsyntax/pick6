@echo off
setlocal enabledelayedexpansion

set "batch_dir=%~dp0"
set "output_folder=%batch_dir%seasons"
set "destination_zip=%batch_dir%\seasons.zip" 

if exist "%output_folder%" (
    echo deleted previous output folder
    rmdir /s /q "%output_folder%"
)

mkdir "%output_folder%"
echo created the output folder

pushd "%batch_dir%"

if exist "%destination_zip%" (
    del "%destination_zip%"
    echo deleted previous seasons zip
)

for /d %%s in (*) do (
    pushd "%%s"

    for /d %%w in (*) do (
        pushd "%%w"

        for %%f in (*Histo*) do (
            set "season_folder=%%s"
  
            REM Extract only the numeric part of the week folder and strip leading '0'
            set "week_folder=%%w"
            set "week_folder=!week_folder:~2!"
            if "!week_folder:~0,1!"=="0" set "week_folder=!week_folder:~1!"
            
            set "file_extension=.csv"

            set "picks_file=Week!week_folder!_!season_folder!_Picks_!file_extension!"
	    set "games_file=Week!week_folder!_!season_folder!_Games_!file_extension!"
            !batch_dir!XlsToCsv "%%~dpnxf" "Picks" "%output_folder%\!picks_file!"
	    echo created "%output_folder%\!picks_file!"
	    !batch_dir!XlsToCsv "%%~dpnxf" "Games" "%output_folder%\!games_file!"
	    echo created "%output_folder%\!games_file!"
        )

        popd
    )

    popd
)

powershell Compress-Archive -Path "%output_folder%\*" -DestinationPath "%destination_zip%"
set powershell_exit_code=%errorlevel%

if %powershell_exit_code% equ 0 (
    rmdir /s /q "%output_folder%"
    echo Zip file created successfully at %destination_zip%
) else (
    echo Compression failed with error code %powershell_exit_code%.
)

popd

pause
