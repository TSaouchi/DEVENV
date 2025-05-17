# Auto-completion for git
Import-Module posh-git
# Theme for terminal
oh-my-posh init pwsh --config 'C:\Users\toufi\AppData\Local\Programs\Oh-my-Posh\themes\amro.omp.json' | Invoke-Expression
# Systme path 
$env:Path += ";
C:\Users\toufi\AppData\Local\Programs\oh-my-posh\bin;
C:\msys64\ucrt64\bin;
C:\Program Files\Alire\bin;
C:\Program Files\MongoDB\mongosh-2.3.3-win32-x64\bin"

function hist_grep {
    #  Description: Search PowerShell history for matching commands
    param (
        [Parameter(ValueFromRemainingArguments = $true)]
        [String[]]$patterns
    )

    # Define the path to PowerShell history file
    $historyFilePath = [System.IO.Path]::Combine($env:USERPROFILE, 
    'AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt')

    # Check that the history file exists
    if (Test-Path $historyFilePath) {
        # Read the history file
        $historyLines = Get-Content $historyFilePath

        # Output the header
        Write-Host "ID`tCommand"
        Write-Host "------------------"

        # Enumerate and output the matching lines with absolute line numbers
        for ($i = 0; $i -lt $historyLines.Length; $i++){
            $command = $historyLines[$i]

            # Skip lines that contains the function name and the function name to invoke the command
            if ($command -match "hist_grep" -or $command -match "invoke_id"){
                continue
            }

            # Check if the command contains all the patterns
            $allPaternsMatch = $true
            foreach ($pattern in $patterns){
                if (-not ($command -match $pattern)) {
                    $allPaternsMatch = $false
                    break
                }
            }
            if ($allPaternsMatch) {
                # Output the absolute line number (i + 1) and the command
                Write-Host ("{0}`t{1}" -f ($i + 1), $command)
            }
        }
    } else {
        Write-Host "History file not found."
    }
}
function invoke_id {
    # Description: Invoke a command from the PowerShell history by its ID
    param (
        [int]$ID
    )

    # Define the path to PowerShell history file
    $historyFilePath = [System.IO.Path]::Combine($env:USERPROFILE, 
    'AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt')

    # Check that the history file exists
    if (Test-Path $historyFilePath) {
        # Read the history file
        $historyLines = Get-Content $historyFilePath

        # Check if the ID is within the valid range
        if ($ID -gt 0 -and $ID -le $historyLines.Length) {
            # Get the command at the specified ID
            $command = $historyLines[$ID - 1]

            # Display the command
            Write-Host ">>> $command"
            # Execute the command
            Invoke-Expression $command
        } else {
            Write-Host "Invalid ID. Please provide a valid ID."
        }
    } else {
        Write-Host "History file not found."
    }
}