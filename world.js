
const init = () => {
    // set initial positions
    const world = initialiseWorld()

    const player = world.player

    world.start()

    const CAPTURE_INPUT = [
        'ArrowLeft', 'ArrowRight', 'Space'
    ]
    // must be false - we need to cancel default actions
    const EVENT_LISTENER_OPTIONS = {passive: false}

    const isKeyDown = {}
    const applyAction = (e, isKeyDown) => {
        // console.debug(`apply action`, { isKeyDown })
        // we have to wait until user interacts with the page, before playing music...
        // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
        world.audio.background.play()
        if (EVENT_LISTENER_OPTIONS.passive === false) e.preventDefault()
        e.stopPropagation()
        if (isKeyDown.ArrowRight) player.goRight()
        else if (isKeyDown.ArrowLeft) player.goLeft()
        else player.stop()
        // no double jump...
        if (isKeyDown.Space) player.jump()
    }
    // add key listeners
    document.addEventListener('keydown', (e) => {
        if (~CAPTURE_INPUT.indexOf(e.code)) {
            isKeyDown[e.code] = true
            applyAction(e, isKeyDown)
        } else {
            console.log(`Unhandled keypress - ${e.code}`)
        }
    }, EVENT_LISTENER_OPTIONS);
    document.addEventListener('keyup', e => {
        if (~CAPTURE_INPUT.indexOf(e.code)) {
            isKeyDown[e.code] = false
            applyAction(e, isKeyDown)
        } else {
            console.log(`Unhandled keypress - ${e.code}`)
        }
    }, EVENT_LISTENER_OPTIONS)
    // util method
    const listener = (name, value) => e => {
        isKeyDown[name] = value
        applyAction(e, isKeyDown)
    }

    const jump = document.querySelector('jump')
    const moveleft = document.querySelector('moveleft')
    const moveright = document.querySelector('moveright')

    // mouse events
    jump.addEventListener('mousedown', listener('Space', true), EVENT_LISTENER_OPTIONS)
    jump.addEventListener('mouseup', listener('Space', false), EVENT_LISTENER_OPTIONS)
    moveleft.addEventListener('mousedown', listener('ArrowLeft', true), EVENT_LISTENER_OPTIONS)
    moveleft.addEventListener('mouseup', listener('ArrowLeft', false), EVENT_LISTENER_OPTIONS)
    moveright.addEventListener('mousedown', listener('ArrowRight', true), EVENT_LISTENER_OPTIONS)
    moveright.addEventListener('mouseup', listener('ArrowRight', false), EVENT_LISTENER_OPTIONS)

    // touch events
    jump.addEventListener('touchstart', listener('Space', true), EVENT_LISTENER_OPTIONS)
    jump.addEventListener('touchend', listener('Space', false), EVENT_LISTENER_OPTIONS)
    jump.addEventListener('touchmove', listener('Space', true), EVENT_LISTENER_OPTIONS)
    jump.addEventListener('touchcancel', listener('Space', false), EVENT_LISTENER_OPTIONS)
    moveleft.addEventListener('touchstart', listener('ArrowLeft', true), EVENT_LISTENER_OPTIONS)
    moveleft.addEventListener('touchend', listener('ArrowLeft', false), EVENT_LISTENER_OPTIONS)
    moveleft.addEventListener('touchmove', listener('ArrowLeft', true), EVENT_LISTENER_OPTIONS)
    moveleft.addEventListener('touchcancel', listener('ArrowLeft', false), EVENT_LISTENER_OPTIONS)
    moveright.addEventListener('touchstart', listener('ArrowRight', true), EVENT_LISTENER_OPTIONS)
    moveright.addEventListener('touchcancel', listener('ArrowRight', false), EVENT_LISTENER_OPTIONS)
    moveright.addEventListener('touchmove', listener('ArrowRight', true), EVENT_LISTENER_OPTIONS)
    moveright.addEventListener('touchend', listener('ArrowRight', false), EVENT_LISTENER_OPTIONS)
}

document.addEventListener("DOMContentLoaded", init)

// functions

function sound(src, loop = false) {
    this.isPlaying = false
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    if (loop === true) this.sound.setAttribute("loop", "true");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = () => {
        if (loop === false || this.isPlaying === false) {
            this.isPlaying = true
            this.sound.play()
        }
        
    }
    this.pause = () => this.sound.pause()
    this.stop = () => {
        this.sound.pause();
        this.sound.currentTime = 0;
        this.isPlaying = false;
    }
  }

const preloadImage = url => (new Image()).src = url

const initialiseWorld = () => {

    const GRAVITY_PXPERSEC = 80
    const ACCEL_PXPERSEC = 20
    const PLATFORM_SPEED = 90
    const DECCEL_PXPERSEC = 40
    const JUMP_VELOCITY = 30
    const MAX_Y_VELOCITY = 30
    const MAX_X_VELOCITY = 15
    const FPS = parseInt(1000 / 45) // 60 fps

    const SCROLL_DEADZONE_WIDTH = 100
    const SCROLL_DEADZONE_HEIGHT = 250

    // preload sprites
    'mario-left.png,mario-right.png,mario-left-run.png,mario-right-run.png,mario-left-jump.png,mario-right-jump.png,mario-left-stop.png,mario-right-stop.png'.split(',').forEach(imgUrl => {
        preloadImage(imgUrl)
    })

    const stats = document.querySelector('stats')

    const deadzone = document.querySelector('scrollDeadZone')
    deadzone.style.width = SCROLL_DEADZONE_WIDTH + 'px'
    deadzone.style.height = SCROLL_DEADZONE_HEIGHT + 'px'

    const world = {
        el: document.querySelector('world'),
        player: null,
        platforms: [],
        enemies: [],
        audio: {},
        hasFocus: true,
        setStats: str => stats.innerHTML = str
    }

    // check if window has focus...
    window.onfocus = () => world.hasFocus = true
    window.onblur = () => world.hasFocus = false

    // audio
    world.audio.death = new sound('smb_mariodie.wav')
    world.audio.jump = new sound('smw_jump.wav')
    world.audio.background = new sound('background.mp3', true)

    const initMoveableObject = p => {
        p.init = () => {
            p.vx = 0
            p.vy = 0
            p.dirx = 0
            p.action = 'standing'
            p.setAttribute('dir', 'right')
        }
        p.init()
        p.y = px => p.xywh.y = p.xywh.y - px
        p.x = px => p.xywh.x = p.xywh.x + px
        p.setY = y => p.xywh.y = y
        p.setX = x => p.xywh.x = x
        p.goLeft = () => p.dirx = -1
        p.goRight = () => p.dirx = 1
    }

    // check the bounds of the world...
    let maxY = 0;
    let maxX = 0;
    document.querySelectorAll('player,platform,toad').forEach(p => {
        // set positions...
        p.toponly = p.hasAttribute('toponly')
        p.touch = p.getAttribute('touch')
        p.moveTo = p.hasAttribute('moveTo') ? parseInt(p.getAttribute('moveTo')) : null
        if (p.hasAttribute('xywh')) {
            let [x, y, w, h] = p.getAttribute('xywh').split(',').map(x => parseInt(x))
            p.xywh = { x, y, w, h }
            p.originalXYWH = { x, y, w, h }
            p.style.left = x + 'px'
            p.style.top = y + 'px'
            p.style.width = w + 'px'
            p.style.height = h + 'px'
            p.vx = 0
            p.vy = 0
            // check world bounds...
            maxY = Math.max(maxY, y+h)
            maxX = Math.max(maxX, x+w)
        }
        console.log(p.tagName)
        initMoveableObject(p)

        if (p.tagName === 'PLAYER') {
            world.player = p
        } else if (p.tagName === 'PLATFORM') {
            world.platforms.push(p)
        } else if (p.tagName === 'TOAD') {
            p.vx = 2
            world.enemies.push(p)
        }
    })
    world.bounds = { w: maxX + 200, h: maxY + 200}
    // set world bounds in html...
    console.debug(`setting world bounds`, world.bounds)
    document.body.style.width = world.bounds.w + 'px'
    document.body.style.height = world.bounds.h + 'px'
    world.el.style.width = world.bounds.w + 'px'
    world.el.style.height = world.bounds.h + 'px'



    // player
    
    const p = world.player
    // console.log(`direction: "${p.dir}"`)
    // functions to translate X/Y positions by...
    p.stop = () => p.dirx = 0
    p.jump = () => {
        if (p.vy === 0) {
            p.vy = JUMP_VELOCITY
            world.audio.jump.play()
        }
    }
    p.death = () => {
        // reset position
        p.xywh = Object.assign({}, p.originalXYWH)
        world.audio.background.pause()
        world.audio.death.play()
        setTimeout(() => world.audio.background.stop(), 4000)
        p.init()
    }
    p.render = deltams => {

        const ACTION_DELTA = deltams / 1000

        // if no direction is being applied...
        if (p.dirx === 0) {
            // if speed is less really slow, stop character.
            if (Math.abs(p.vx) < 1.8) {
                p.vx = 0
                p.action = 'standing'
            }
            // if not falling, and not moving, grind to zero...
            else if (p.vy === 0) {
                p.vx += DECCEL_PXPERSEC * ACTION_DELTA * (p.vx > 0 ? -1 : 1) // deccel in opposite direction
                p.action = Math.abs(p.vx) > 1 ? 'running' : 'standing'
            }
        }
        // direction is being applied, accelerate in direction...
        else {
            // if accelerating in opposite direction, apply DECCEL (which is bigger)
            const sameDirection = p.dirx > 0 && p.vx > 0 || p.dirx < 0 && p.vx < 0
            p.vx += (sameDirection ? ACCEL_PXPERSEC : DECCEL_PXPERSEC) * ACTION_DELTA * p.dirx
            p.action = sameDirection ? 'running' : 'stopping'
            if (Math.abs(p.vx) > MAX_X_VELOCITY) p.vx = MAX_X_VELOCITY * Math.sign(p.vx)
        }
        p.x(p.vx)
        // apply gravity...
        p.vy -= GRAVITY_PXPERSEC * ACTION_DELTA
        if (Math.abs(p.vy) > MAX_Y_VELOCITY) p.vy = MAX_Y_VELOCITY * Math.sign(p.vy)
        p.y(p.vy)


        // check for collisions with platform...
        const checkCollision = (xywh1, xywh2) => {
            // check if object intercepts (positive number) the vertical or horizontal space of a second object...
            const hdiff = Math.min(xywh1.x + xywh1.w, xywh2.x + xywh2.w) - Math.max(xywh1.x, xywh2.x)
            const vdiff = Math.min(xywh1.y + xywh1.h, xywh2.y + xywh2.h) - Math.max(xywh1.y, xywh2.y)
            
            // if object overlaps the horizontal and vertical space, then they have collided with the second object...
            return { 
                hdiff, 
                vdiff, 
                collided: hdiff > 0 && vdiff > 0, 
                full: vdiff === Math.min(xywh1.h, xywh2.h) && hdiff === Math.min(xywh1.w, xywh2.w),
                primarilyVerticalCollision: hdiff > vdiff
            }
        }

        world.enemies.forEach(enemy => {
            // console.log('moving enemy', { vx: enemy.vx})
            enemy.x(enemy.vx)


            // if player is overlaps the horizontal and vertical space, then they have collided with box...
            const { collided, primarilyVerticalCollision } = checkCollision(p.xywh, enemy.xywh)
            
            // if collision, push object outside of box (based on center of mass vs primary side collided)
            if (collided) {
                
                // if touch means death, break out of loop...
                if (enemy.touch === 'death') {
                    p.death()
                    // break;
                }
            }
        })

        // move platforms
        world.platforms.forEach(platform => {
            const { moveTo, xywh, originalXYWH } = platform
            if (moveTo) {
                const { x } = xywh
                const diffTarget = x - moveTo
                const diffSource = x - originalXYWH.x
                if (platform.dirx === 0) { // if not moving, move towards target...
                    platform.dirx = diffTarget < 0 ? 1 : -1
                } else if (platform.dirx > 0 && diffTarget >= 0) { // moving right and at the target...
                    platform.dirx = -1
                } else if (platform.dirx < 0 && diffSource <= 0) { // moving left and at the source...
                    platform.dirx = 1
                }
                
                platform.x(PLATFORM_SPEED * ACTION_DELTA * platform.dirx)
            }
        })

        const p2 = p.xywh
        for (let i = 0; i < world.platforms.length; i++) {
            const platform = world.platforms[i]
            const {xywh: p1, toponly, touch } = platform
            
            // if player is overlaps the horizontal and vertical space, then they have collided with box...
            const { collided, primarilyVerticalCollision } = checkCollision(p.xywh, platform.xywh)
            
            // if collision, push object outside of box (based on center of mass vs primary side collided)
            if (collided) {
                
                // if touch means death, break out of loop...
                if (touch === 'death') {
                    p.death()
                    break;
                }
                
                // collision top or bottom...
                if (primarilyVerticalCollision) {
                    const p2vcenter = p2.y + (p2.h / 2)
                    const p1vcenter = p1.y + (p1.h / 2)
                    // if top (and player is descending)...
                    if (p2vcenter < p1vcenter && p.vy < 0) {
                        // console.debug(`move up ${p2vcenter} ${p1vcenter}`)
                        p2.y = p1.y - p2.h
                        // zero vertical velocity...
                        p.vy = 0
                        // if platform has velocity, also move mario...
                        if (platform.dirx !== 0) p.x(PLATFORM_SPEED * ACTION_DELTA * platform.dirx)
                    }
                    // else if bottom (and player is ascending) and not "top only"...
                    else if (toponly !== true && p2vcenter > p1vcenter && p.vy > 0) {
                        console.debug(`move down`, { p2vcenter, p1vcenter, toponly })
                        p2.y = p1.y + p1.h
                        // zero vertical velocity...
                        p.vy = 0
                        
                    }
                } 
                // collision left or right (and not "top only")...
                else if (toponly !== true) { 
                    const p2hcenter = p2.x + (p2.w / 2)
                    const p1hcenter = p1.x + (p1.w / 2)
                    // if entering from left and player is travelling right...
                    if (p2hcenter < p1hcenter && p.vx > 0) {
                        console.debug(`move left`, { p2hcenter, p1hcenter, toponly })
                        p2.x = p1.x - p2.w
                    }
                    // else entering from right and player is travelling left...
                    else if (p2hcenter > p1hcenter && p.vx < 0) {
                        console.debug(`move right`, { p2hcenter, p1hcenter, toponly })
                        p2.x = p1.x + p1.w
                    }
                    // zero horizontal velocity...
                    p.vx = 0
                }
            }
        }
        world.platforms.forEach(el => {
        })
        if (p.vy !== 0) p.action = 'jumping' // or falling

        // stop player from going left past the start...
        if (p.xywh.x < 0) {
            p.xywh.x = 0
            p.vx = 0
        }

        // DO ACTUAL RENDER ON PAGE

        // get player fields...
        const { vx, vy } = p
        const { x,y,w,h } = p.xywh

        // get deadzone position... (deadzone is an area where the player can move, without scrolling the window)
        var doc = document.documentElement;
        const outerdeadzoneX = (window.innerWidth - SCROLL_DEADZONE_WIDTH - w) / 2
        const outerdeadzoneY = (window.innerHeight - SCROLL_DEADZONE_HEIGHT -h) / 2
        let scrollLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
        let scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        const deadzone = {
            x1: scrollLeft + outerdeadzoneX,
            x2: scrollLeft + outerdeadzoneX + SCROLL_DEADZONE_WIDTH,
            y1: scrollTop + outerdeadzoneY,
            y2: scrollTop + outerdeadzoneY + SCROLL_DEADZONE_HEIGHT,
        };

        // move window along with player...
        if (x < deadzone.x1) {
            scrollLeft = x - outerdeadzoneX
        } else if (x > deadzone.x2) {
            scrollLeft = x - outerdeadzoneX - SCROLL_DEADZONE_WIDTH
        }
        if (y < deadzone.y1) {
            scrollTop = y - outerdeadzoneY
        } else if (y > deadzone.y2) {
            scrollTop = y - outerdeadzoneY - SCROLL_DEADZONE_HEIGHT
        }
        window.scrollTo(scrollLeft, scrollTop)

        // show stats
        world.setStats(JSON.stringify({
            vel: { 
                x: parseInt(vx), 
                y: parseInt(vy)
            }, 
            loc: {
                x: parseInt(x),
                y: parseInt(y),
                w: parseInt(w),
                h: parseInt(h)
            },
            scroll: {
                top: parseInt(scrollTop), 
                left: parseInt(scrollLeft)
            }
        }))

        // todo only update if changed... (the actual html changes)
        
        // player
        p.style.top = Math.floor(y) + 'px'
        p.style.left = Math.floor(x) + 'px'

        // enemies
        world.enemies.forEach(platform => {
            platform.style.top = Math.floor(platform.xywh.y) + 'px'
            platform.style.left = Math.floor(platform.xywh.x) + 'px'
        })

        // platforms
        world.platforms.forEach(platform => {
            platform.style.top = Math.floor(platform.xywh.y) + 'px'
            platform.style.left = Math.floor(platform.xywh.x) + 'px'
        })
        if (p.dirx !== 0) p.setAttribute('dir', p.dirx < 0 ? 'left' : 'right')
        p.setAttribute('action', p.action)
    }

    // world

    world.start = () => {
        let last = new Date().getTime()
        const interval = setInterval(() => {
            try {
            let inst = new Date().getTime()
            if (world.hasFocus) world.player.render(inst - last)
            last = inst
        } catch (err) {
            console.error(err)
            clearInterval(interval)
        }
        }, FPS)
    }
    
    return world
}

