package uk.co.electronstudio.mobcontrol;

import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import org.eclipse.jetty.websocket.api.RemoteEndpoint;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;

import java.awt.*;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicReferenceArray;

import static uk.co.electronstudio.mobcontrol.MobController.*;

public class WebSocket extends WebSocketAdapter {
    static MobControllerManager mobControllerManager;

    private MobController controller;

    final AtomicReferenceArray<Float> controllerAxis = new AtomicReferenceArray<>(SDL_CONTROLLER_AXIS_MAX);
    final AtomicReferenceArray<Boolean> controllerButtons = new AtomicReferenceArray<>(SDL_CONTROLLER_BUTTON_MAX);

    volatile Color colour1 = Color.WHITE;
    volatile Color colour2 = Color.WHITE;
    volatile String playerName = "Player";


    @Override
    public void onWebSocketConnect(Session sess) {
        super.onWebSocketConnect(sess);
        System.out.println("Socket Connected: " + sess);
        for (int i = 0; i < controllerAxis.length(); i++) {
            controllerAxis.set(i, 0f);
        }
        for (int i = 0; i < controllerButtons.length(); i++) {
            controllerButtons.set(i, false);
        }
        controller = new MobController(mobControllerManager, this);
        mobControllerManager.connectionQueue.add(controller);
    }

    @Override
    public void onWebSocketText(String message) {
        super.onWebSocketText(message);
        //System.out.println(controller + " Received TEXT message: " + message);
        JsonValue fromJson = new JsonReader().parse(message);


        String type = fromJson.getString("__type__", "");
        switch (type) {
            case "set_name":
                playerName = fromJson.getString("name");
                break;
            case "set_colour_1":
                int[] rgb = fromJson.get("rgb").asIntArray();
                colour1 = new Color(rgb[0], rgb[1], rgb[2]);
                break;
            case "set_colour_2":
                int[] rgb2 = fromJson.get("rgb").asIntArray();
                colour2 = new Color(rgb2[0], rgb2[1], rgb2[2]);
                break;
            default:
                padUpdate(fromJson);
                break;
        }


    }

    private void padUpdate(JsonValue fromJson) {
        for (int i = 0; i < SDL_CONTROLLER_BUTTON_MAX; i++) {
            if (fromJson.has(buttonNames[i])) {
                controllerButtons.set(i, fromJson.getBoolean(buttonNames[i]));
            }
        }
        for (int i = 0; i < SDL_CONTROLLER_AXIS_MAX; i++) {
            if (fromJson.has(axisNames[i])) {
                controllerAxis.set(i, fromJson.getFloat(axisNames[i]));
            }
        }
    }

    @Override
    public void onWebSocketClose(int statusCode, String reason) {
        super.onWebSocketClose(statusCode, reason);
        System.out.println("Socket Closed: [" + statusCode + "] " + reason);
        mobControllerManager.disConnectionQueue.add(controller);
        controller = null;
    }

    @Override
    public void onWebSocketError(Throwable cause) {
        super.onWebSocketError(cause);
        cause.printStackTrace(System.err);
    }

    public void sendRumble(float leftMagnitude, float rightMagnitude, int duration_ms) {
        String json = "{ \"header\": \"vibrate\", \"data\": { \"mag_left\": " + leftMagnitude + ", \"mag_right\": " + rightMagnitude + ", \"duration_ms\": " + duration_ms + " } }";
        System.out.println(json);
        try {
            RemoteEndpoint remote = getRemote();
            if (remote != null) {
                remote.sendString(json);
                getRemote().flush();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

    }
}
