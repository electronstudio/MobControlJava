# Demo

See MobControl in action by downloading the beta version of [RetroWar: 8-bit Party Battle](https://store.steampowered.com/app/664240/RetroWar_8bit_Party_Battle/?git)  Defeat up to 15 of your friends in a tournament of 80s-inspired retro mini games.

# MobControl

Use mobile devices as game controllers.

## Requirements

The server requires Java 1.8+.  The clients can be any system with a web browser, but ideally a mobile phone running Android or iOS.

## Test

```
./gradlew run
```

## Use in your project

```diff
buildscript{
    repositories {
+        jcenter()
    }
```


```diff
    dependencies {
+       compile "uk.co.electronstudio.mobcontrol:mobcontrol:0.1.+"
    }
}
```


## License

MobControl is distributed under GPL+Classpath license, the same as OpenJDK itself, so you will have no
problem using it anywhere you use OpenJDK.