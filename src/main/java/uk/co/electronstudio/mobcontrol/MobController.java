package uk.co.electronstudio.mobcontrol;


import com.badlogic.gdx.controllers.ControllerListener;
import com.badlogic.gdx.controllers.PovDirection;
import com.badlogic.gdx.math.Vector3;
import com.badlogic.gdx.utils.Array;


public class MobController implements RumbleController {

    public static final int SDL_CONTROLLER_AXIS_INVALID = -1,
            SDL_CONTROLLER_AXIS_LEFTX = 0,
            SDL_CONTROLLER_AXIS_LEFTY = 1,
            SDL_CONTROLLER_AXIS_RIGHTX = 2,
            SDL_CONTROLLER_AXIS_RIGHTY = 3,
            SDL_CONTROLLER_AXIS_TRIGGERLEFT = 4,
            SDL_CONTROLLER_AXIS_TRIGGERRIGHT = 5,
            SDL_CONTROLLER_AXIS_MAX = 6;



    public static final int SDL_CONTROLLER_BUTTON_INVALID = -1,
            SDL_CONTROLLER_BUTTON_A = 0,
            SDL_CONTROLLER_BUTTON_B = 1,
            SDL_CONTROLLER_BUTTON_X = 2,
            SDL_CONTROLLER_BUTTON_Y = 3,
            SDL_CONTROLLER_BUTTON_BACK = 4,
            SDL_CONTROLLER_BUTTON_GUIDE = 5,
            SDL_CONTROLLER_BUTTON_START = 6,
            SDL_CONTROLLER_BUTTON_LEFTSTICK = 7,
            SDL_CONTROLLER_BUTTON_RIGHTSTICK = 8,
            SDL_CONTROLLER_BUTTON_LEFTSHOULDER = 9,
            SDL_CONTROLLER_BUTTON_RIGHTSHOULDER = 10,
            SDL_CONTROLLER_BUTTON_DPAD_UP = 11,
            SDL_CONTROLLER_BUTTON_DPAD_DOWN = 12,
            SDL_CONTROLLER_BUTTON_DPAD_LEFT = 13,
            SDL_CONTROLLER_BUTTON_DPAD_RIGHT = 14,
            SDL_CONTROLLER_BUTTON_MAX = 15;


    public static final int SDL_HAT_CENTERED = 0x00,
            SDL_HAT_UP = 0x01,
            SDL_HAT_RIGHT = 0x02,
            SDL_HAT_DOWN = 0x04,
            SDL_HAT_LEFT = 0x08,
            SDL_HAT_RIGHTUP = (SDL_HAT_RIGHT | SDL_HAT_UP),
            SDL_HAT_RIGHTDOWN = (SDL_HAT_RIGHT | SDL_HAT_DOWN),
            SDL_HAT_LEFTUP = (SDL_HAT_LEFT | SDL_HAT_UP),
            SDL_HAT_LEFTDOWN = (SDL_HAT_LEFT | SDL_HAT_DOWN);

    public static final String[] buttonNames = {
            "BUTTON_A",
            "BUTTON_B",
            "BUTTON_X",
            "BUTTON_Y",
            "BUTTON_BACK",
            "BUTTON_GUIDE",
            "BUTTON_START",
            "BUTTON_LEFTSTICK",
            "BUTTON_RIGHTSTICK",
            "BUTTON_LEFTSHOULDER",
            "BUTTON_RIGHTSHOULDER",
            "BUTTON_DPAD_UP",
            "BUTTON_DPAD_DOWN",
            "BUTTON_DPAD_LEFT",
            "BUTTON_DPAD_RIGHT"};

    public static final String[] axisNames = {
            "AXIS_LEFTX",
            "AXIS_LEFTY",
            "AXIS_RIGHTX",
            "AXIS_RIGHTY",
            "AXIS_TRIGGERLEFT",
            "AXIS_TRIGGERRIGHT",
    };


    private final WebSocket webSocket;

    private final MobControllerManager manager;
    private final String name;
    private final Array<ControllerListener> listeners = new Array<ControllerListener>();


    private final float[] oldAxisState;
    private final boolean[] oldButtonState;
    private final PovDirection[] oldHatState;
    private final static Vector3 zero = new Vector3(0, 0, 0);


    public MobController(MobControllerManager manager, WebSocket webSocket) {
        this.manager = manager;
        this.webSocket = webSocket;


        oldHatState = new PovDirection[1];
        oldButtonState = new boolean[SDL_CONTROLLER_BUTTON_MAX];
        oldAxisState = new float[SDL_CONTROLLER_AXIS_MAX];

        name = webSocket.getRemote().getInetSocketAddress().toString();

    }

    public boolean isConnected() {
        return webSocket.isConnected();
    }


    void pollState() {
        for (int i = 0; i < oldAxisState.length; i++) {
            if (oldAxisState[i] != getAxis(i)) {
                for (ControllerListener listener : listeners) {
                    listener.axisMoved(this, i, getAxis(i));
                }
                manager.axisChanged(this, i, getAxis(i));
            }
            oldAxisState[i] = getAxis(i);
        }


        for (int i = 0; i < oldButtonState.length; i++) {
            if (oldButtonState[i] != getButton(i)) {
                for (ControllerListener listener : listeners) {
                    if (getButton((i))) {
                        listener.buttonDown(this, i);
                    } else {
                        listener.buttonUp(this, i);
                    }
                }
                manager.buttonChanged(this, i, getButton(i));
            }
            oldButtonState[i] = getButton(i);
        }

        for (int i = 0; i < oldHatState.length; i++) {
            if (oldHatState[i] != getPov(i)) {
                oldHatState[i] = getPov(i);
                for (ControllerListener listener : listeners) {
                    listener.povMoved(this, i, getPov(i));
                }
                manager.hatChanged(this, i, getPov(i));
            }
        }

    }

    @Override
    public void addListener(ControllerListener listener) {
        listeners.add(listener);
    }

    @Override
    public void removeListener(ControllerListener listener) {
        listeners.removeValue(listener, true);
    }

    @Override
    public boolean getButton(int buttonCode) {
        return webSocket.controllerState.getButton(buttonCode);
    }

    @Override
    public float getAxis(int axisCode) {
        return webSocket.controllerState.getAxis(axisCode);
    }

    @Override
    public PovDirection getPov(int povCode) {
        if (oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_UP] && oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_RIGHT])
            return PovDirection.northEast;
        else if (oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_UP] && oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_LEFT])
            return PovDirection.northWest;
        else if (oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_DOWN] && oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_RIGHT])
            return PovDirection.southEast;
        else if (oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_DOWN] && oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_LEFT])
            return PovDirection.southWest;
        else if (oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_UP]) return PovDirection.north;
        else if (oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_RIGHT]) return PovDirection.east;
        else if (oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_DOWN]) return PovDirection.south;
        else if (oldButtonState[SDL_CONTROLLER_BUTTON_DPAD_LEFT]) return PovDirection.west;
        else return PovDirection.center;
    }

    @Override
    public boolean getSliderX(int sliderCode) {
        return false;
    }

    @Override
    public boolean getSliderY(int sliderCode) {
        return false;
    }

    @Override
    public Vector3 getAccelerometer(int accelerometerCode) {
        return zero;
    }

    @Override
    public void setAccelerometerSensitivity(float sensitivity) {
    }

    @Override
    public String getName() {
       return name;
    }

    @Override
    public String toString() {
        return getName();
    }

    public void close() {

    }

    /**
     * Vibrate the controller using the new rumble API
     * This will return false if the controller doesn't support vibration or if SDL was unable to start
     * vibration (maybe the controller doesn't support left/right vibration, maybe it was unplugged in the
     * middle of trying, etc...)
     *
     * @param leftMagnitude  The speed for the left motor to vibrate (this should be between 0 and 1)
     * @param rightMagnitude The speed for the right motor to vibrate (this should be between 0 and 1)
     * @return Whether or not the controller was able to be vibrated (i.e. if rumble is supported)
     */
    public boolean rumble(float leftMagnitude, float rightMagnitude, int duration_ms) {
        return false;
    }

    public static String getButtonName(int i){
        return buttonNames[i];
    }

    public static String getAxisName(int i){
        return axisNames[i];
    }

}
