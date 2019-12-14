package uk.co.electronstudio.mobcontrol;

import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import org.eclipse.jetty.websocket.api.RemoteEndpoint;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;

import java.util.concurrent.atomic.AtomicReferenceArray;

import static uk.co.electronstudio.mobcontrol.MobController.*;

public class WebSocket extends WebSocketAdapter {
    static MobControllerManager mobControllerManager;

    private MobController controller;

    final AtomicReferenceArray<Float> controllerAxis = new AtomicReferenceArray<>(SDL_CONTROLLER_AXIS_MAX);
    final AtomicReferenceArray<Boolean> controllerButtons = new AtomicReferenceArray<>(SDL_CONTROLLER_BUTTON_MAX);

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
        System.out.println("type: "+type);
        switch (type) {
            case "set_name":
                String name = fromJson.getString("name");
                System.out.println("name: " + name);
                break;
            case "set_colour_1":
                String c1 = fromJson.getString("colour");
                System.out.println("c1: " + c1);
                break;
            case "set_colour_2":
                String c2 = fromJson.getString("colour");
                System.out.println("c2: " + c2);
                break;
            default:
                //System.out.println("padupdate");
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
