# Step by step how to stup my DevEnv 

## Software to install
- VScode 
    - Python 
    - Pylance
    - Jupyter
    - diff
    - Theme : Sublime Material Theme
    - json crack
    - Comment Anchor
    - spacetime
    - Anchor comment
    - rainbow indent
    - git graph
    - Data Wrangler
    - ...
- Obsidian 
- Git + Github settings to use ssh key
- Font Powershell and terminals 
    - Hack font 
- Cygwin, MSYS or else for C/C++ compilor and debug 
- Keepass for passwords management 
- Python 
- ChatGPT and Claude : AI 

## VScode settings to change 
- Save delay to ``afterdelay`` delay time ``1ms``
- Zoom ``-2``
- Edit the ruler for a width of ``80`` and a color ``red``
    - Open user ``settings.json``
    Add: 
    ```json
    "editor.rulers": [{
        "column": 80,
        "color": "red"
    }]
    ``` 
- To use the same powershell in vscode and windows do:
    - Settings > search "powershell" > set Windows Powershell
    
## Install terminal font 
1. Enable script execution on a powersehll terminal 
    - Check terminal execution policy 
    ```powershll 
    Get-ExecutionPolicy
    ```
    - If it's set to ``restricted`` do :
    ```powershll 
    Set-ExecutionPolicy Unrestricted -scope curentuser
    ```
2. Install ``Oh-My-Posh``
    - Do a manual installation using: 
    ```powershell 
    Set-ExecutionPolicy Bypass -Scope Process -Force; Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://ohmyposh.dev/install.ps1'))
    ```
3. Install ``Hack`` font and set powershell and VScode to use it 
    - Install ``HackNerdFontMono-Regular`` from the directory Fonts/Hack 
    or 
    - Using ``Oh-My-Posh`` in a terminal and choose (down arrow) ``Hack``
    ```powershell
    oh-my-posh font install
    ```
4. Run ``Oh-My-Posh`` at terminal opening 
    - Edit powershell profile file using for instance
    ```powershell 
    code $PROFILE 
    ```
    and past this: 
    ```powershell
    # One can add here any path to add to the system path
    $env:Path += ";C:\Users\toufi\AppData\Local\Programs\oh-my-posh\bin"
    # Invoke (from a disk) Oh-My-Posh at termianl openeing and set a theme
    oh-my-posh init pwsh --config 'C:\Users\toufi\AppData\Local\Programs\Oh-my-Posh\themes\amro.omp.json' | Invoke-Expression
    ```
5. Set the mono font in VScode and Powershell 
    - Past in user ``settings.json``
    ```json
    "editor.fontFamily": "Consolas, 'Courier New', monospace",
    "terminal.integrated.fontFamily": "Hack Nerd Font Mono",
    ```
    - Close and Restart VScode
6. Install terminal Icons using:
```powershell
Install-Module -Name Terminal-Icons -Repository PSGallery -Scope CurrentUser -Force
```
- Import the module in ``$PROFILE`` using:
```powershell
Import-Module -Name Terminal-Icons
```

## Git configuration 
1. Past the follwing in ``git config --global -e``
    ```powershell 
    # This is Git's per-user configuration file.
    [user]
        name = T.Saouchi
        email = saouchi.toufik@gmail.com
        
    [core]
  	editor = code --wait

    [diff]
	tool = vscode
    [difftool "vscode"]
	cmd = code --wait --diff $LOCAL $REMOTE
	
    [merge]
	tool = vscode
    [mergetool "vscode"]
	cmd = code --wait $MERGED
    
    [alias]
        st = status
        ci = commit 
        a = add
        aa = add -A
        pushall = "!f() { for remote in $(git remote); do git push $remote --all && git push $remote --tags; done; }; f"
	    pushthis = "!f() { for remote in $(git remote); do git push $remote $(git branch --show-current); done; }; f"
    ```
    
2. Install ``posh-git`` using:
   ```powershell
   Install-Module posh-git -Scope CurrentUser
   ```
   - Copy bellow line in the machine ``$PROFILE`` file to enable the import of ``posh-git``
   ```powershell
   Import-Module posh-git
   ```
