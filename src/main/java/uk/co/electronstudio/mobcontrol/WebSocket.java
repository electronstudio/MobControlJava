package uk.co.electronstudio.mobcontrol;

import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.WebSocketAdapter;

import static uk.co.electronstudio.mobcontrol.MobController.*;

public class WebSocket extends WebSocketAdapter
{

    static MobControllerManager mobControllerManager;

    volatile ControllerState controllerState = new ControllerState();

    private MobController controller;

    @Override
    public void onWebSocketConnect(Session sess)
    {
        super.onWebSocketConnect(sess);
        System.out.println("Socket Connected: " + sess);
        controller = new MobController(mobControllerManager, this);
        mobControllerManager.connectionQueue.add(controller);
    }
    
    @Override
    public void onWebSocketText(String message)
    {
        super.onWebSocketText(message);
        System.out.println(controller+" Received TEXT message: " + message);
        JsonValue fromJson = new JsonReader().parse(message);
        float [] axisState = new float[SDL_CONTROLLER_AXIS_MAX];
        boolean [] buttonState = new boolean[SDL_CONTROLLER_BUTTON_MAX];
        for(int i=0; i<SDL_CONTROLLER_BUTTON_MAX; i++) {
            buttonState[i] = fromJson.getBoolean(buttonNames[i], false);
        }
        for(int i=0; i<SDL_CONTROLLER_AXIS_MAX; i++) {
            axisState[i] = fromJson.getFloat(axisNames[i], 0.0f);
        }
        controllerState = new ControllerState(axisState, buttonState);
    }
    
    @Override
    public void onWebSocketClose(int statusCode, String reason)
    {
        super.onWebSocketClose(statusCode,reason);
        System.out.println("Socket Closed: [" + statusCode + "] " + reason);
        mobControllerManager.disConnectionQueue.add(controller);
        controller = null;
    }
    
    @Override
    public void onWebSocketError(Throwable cause)
    {
        super.onWebSocketError(cause);
        cause.printStackTrace(System.err);
    }
}
